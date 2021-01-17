'use strict'

const context = require('@/context-manager')
const es = require('@acs/elasticsearch-accessor')
const json = require('@h/json-helper')

/**
 * @description ローソク足の傾き分析機能を提供します。
 */
module.exports = {
  /**
   * @description ローソク足の傾きを予測します。
   * @returns {void}
   */
  async predicate () {
    // パラメータを取得
    const param = getParam()

    // ローソク足を取得
    const reader = require('@r/instrument-reader')
    const moment = require('moment')
    const from = moment().subtract(param.from, 'm').format()
    const { candles } = await reader.getCandles(
      param.instrument,
      {
        price: param.price,
        granularity: param.granularity,
        from
      }
    )

    // 分析用の形式に整形
    const data = map(candles, param)
    console.log('★')
    console.log(data)
  },
  /**
   * @description ローソク足の傾き予測の学習用データを作成します。
   * @returns {void}
   */
  async learn () {
    // ファイルを削除
    clearFile()

    // パラメータを取得
    const param = getParam()

    // 期間指定
    const moment = require('moment')
    const now = moment()
    let from = moment().subtract(param.learnings.from, 'M').format()
    let to = moment(from).add(param.from, 'm').format()
    let ansTo = moment(to).add(param.learnings.answer, 'h').format()
    let diff = now.diff(ansTo)
    const slideRange = param.from / param.slideRate
    let inputs = []
    let answers = []
    let i = 0
    const test = false
    // eslint-disable-next-line no-unmodified-loop-condition
    while (diff > 0 && (!test || i < 3)) {
      console.log(from)
      console.log(to)
      // 学習用ローソク足を取得
      let body = json.readEsQuery(
        'select-candle',
        {
          granularity: param.granularity,
          instrument: param.instrument,
          from,
          to
        }
      )
      let result = await es.search(
        'candle',
        {
          body,
          sort: 'time:asc'
        }
      )
      const insCandles = result.body.hits.hits.map(h => h._source)
      inputs.push(map(insCandles, param))
      if (i === 0) {
        console.log(`input length is ${inputs[0].length}`)
      }
      // 教師用ローソク足を取得
      body = json.readEsQuery(
        'select-candle',
        {
          granularity: param.granularity,
          instrument: param.instrument,
          from,
          to: ansTo
        }
      )
      result = await es.search(
        'candle',
        {
          body,
          sort: 'time:asc'
        }
      )
      const ansCandles = result.body.hits.hits.map(h => h._source)
      const answer = map(ansCandles, param)[ansCandles.length - 2]
      answers.push([answer])
      from = moment(from).add(slideRange, 'm').format()
      to = moment(from).add(param.from, 'm').format()
      ansTo = moment(to).add(param.learnings.answer, 'h').format()
      diff = now.diff(ansTo)
      console.log(diff)
      i++
      if (i % param.learnings.writingUnit === 0) {
        console.log(`${i} now writing...`)
        // データを書き込む
        write(inputs, 'input')
        write(answers, 'answer')
        inputs = []
        answers = []
      }
    }
    if (inputs.length > 0) {
      // データを書き込む
      write(inputs, 'input')
      write(answers, 'answer')
    }
  }
}

/**
 * @description パラメータを取得します。
 * @returns {Object} パラメータ
 */
function getParam () {
  return context.getConfig().analytics.candleSlope
}

/**
 * @description データを加工します。
 * @param list - データ配列
 * @param param - パラメータ
 * @returns {Array} 加工したデータ
 */
function map (list, param) {
  // 対象データを抽出
  let target
  switch (param.price) {
    case 'M':
      target = 'mid'
      break
    case 'B':
      target = 'bid'
      break
    case 'A':
      target = 'ask'
      break
    default:
      throw new Error(`unexpected price ${param.price}`)
  }
  const rawDatas = list.map(l => l[target][param.usingData])
  const length = rawDatas.length

  // 傾きに変換
  const slopes = rawDatas
    .map((r, i, ar) => {
      if (length - 1 <= i) {
        return -999
      }
      return ar[i + 1] - r
    })
    .filter((r, i) => i < length - 1)
  return slopes
}

/**
 * @description データの書き込みを行います。
 * @param {Array} data - データ
 * @param {String} prefix - ファイル名のプレフィックス
 */
function write (data, prefix) {
  const csvHelper = require('@h/csv-helper')
  const fs = require('fs')
  const dataCsv = csvHelper.toCsv(data)
  fs.appendFileSync(`resources/learnings/${prefix}.csv`
    , dataCsv
    , { encoding: 'utf-8' }
  )
}

/**
 * @description ファイルを削除します。
 */
function clearFile () {
  const fs = require('fs')
  const path = require('path')
  const files = fs.readdirSync('resources/learnings/')
    .map(f => path.join('resources/learnings/', f))

  // 削除
  for (const file of files) {
    if (!require('@h/file-helper').existsFile(file)) {
      continue
    }
    fs.unlinkSync(file)
  }
}
