'use strict'

const context = require('@/context-manager')
const es = require('@acs/elasticsearch-accessor')
// const jsonHelper = require('@h/json-helper')
// const moment = require('moment')

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

    const moment = require('moment')
    const from = moment().subtract(param.from, 'M').format()
    console.log(from)
    // ローソク足を取得
    const reader = require('@r/instrument-reader')
    const res = await reader.getCandles(
      param.instrument,
      {
        price: param.price,
        granularity: param.granularity
      }
    )
    // ESのインデックスデータを作成
    const indexs = map(res, param)
    // ESに登録
    const result = await es.bulkUpsert('candle', indexs)
    console.log(result)
    // eslint-disable-next-line no-unmodified-loop-condition
    // while (diff > 0 && (!test || i < 1)) {
    // }
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
