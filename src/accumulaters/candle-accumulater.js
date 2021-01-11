'use strict'

const context = require('@/context-manager')
const es = require('@acs/elasticsearch-accessor')
const oanda = require('@acs/oanda-accessor')
const moment = require('moment')
const sleep = require('thread-sleep')

/**
 * @description ローソク足の蓄積機能を提供します。
 */
module.exports = {
  /**
   * @description ローソク足を蓄積します。
   * @returns {void}
   */
  async accumulate () {
    // パラメータを取得
    const param = getParam()

    const test = false
    let i = 0
    let from = moment().subtract(param.from, 'M').format()
    // eslint-disable-next-line no-unmodified-loop-condition
    while (!test || i < 3) {
      console.log(`get from ${from}`)
      // ローソク足を取得
      const req = {
        price: param.price,
        granularity: param.granularity,
        from,
        count: param.count
      }
      const res = await oanda.getCandles(
        param.instrument,
        req
      )
      // ESのインデックスデータを作成
      const indexs = map(res, param)
      // ESに登録
      const result = await es.bulkUpsert('candle', indexs)
      console.log(`total: ${result.total}, suucessful: ${result.successful}`)
      // 取得開始日時を更新
      from = getFromDatetime(indexs)
      i++
      // 結果が取得予定件数より少なければ処理終了
      if (!Array.isArray(res.candles) || res.candles.length < param.count) {
        break
      }
      console.log('start sleep...')
      sleep(param.sleep)
      console.log('end sleep')
    }
    console.log('finish accumulate')
  }
}
/**
 * @description パラメータを取得します。
 * @returns {Object} パラメータ
 */
function getParam () {
  return context.getConfig().accumulate
}

/**
 * @description データを加工します。
 * @param rows - データ配列
 * @param param - パラメータ
 * @returns {Array} 加工したデータ
 */
function map (response, param) {
  const indexs = response.candles.map(c => {
    const index = {
      id: generateId(c, param),
      granularity: response.granularity,
      instrument: response.instrument,
      time: c.time,
      volume: c.volume
    }
    if (c.bid) {
      index.bid = {
        o: c.bid.o,
        h: c.bid.h,
        l: c.bid.l,
        c: c.bid.c
      }
    }
    if (c.ask) {
      index.ask = {
        o: c.ask.o,
        h: c.ask.h,
        l: c.ask.l,
        c: c.ask.c
      }
    }
    if (c.mid) {
      index.mid = {
        o: c.mid.o,
        h: c.mid.h,
        l: c.mid.l,
        c: c.mid.c
      }
    }
    return index
  })
  return indexs
}

/**
 * @description レコードのIDを生成します。
 * @param {Object} row レコード
 * @param {Object} param パラメータ
 * @returns {String} レコードのID
 */
function generateId (row, param) {
  return `${param.instrument}-${param.granularity}-${row.time.replace(/:/g, '-').replace(/\./g, '-')}`.toLowerCase()
}

/**
 * @description 開始日時を取得します。
 * @param {Object} param パラメータ
 * @returns {String} 開始日時
 */
function getFromDatetime (indexs) {
  const last = indexs.slice(-1)[0]
  return moment(last.time).format()
}
