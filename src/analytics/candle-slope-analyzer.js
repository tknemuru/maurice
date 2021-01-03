'use strict'

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
    const slideRange = param.from / 3
    let inputs = []
    let answers = []
    let raws = []
    let i = 0
    const reader = require('@r/instrument-reader')
    const sleep = require('thread-sleep')
    const test = false
    // eslint-disable-next-line no-unmodified-loop-condition
    while (diff > 0 && (!test || i < 4)) {
      console.log(from)
      console.log(to)
      // 学習用ローソク足を取得
      const ins = await reader.getCandles(
        param.instrument,
        {
          price: param.price,
          granularity: param.granularity,
          from,
          to
        }
      )
      const insCandles = ins.candles
      inputs.push(map(insCandles, param))
      if (i === 0) {
        console.log(`input length is ${inputs[0].length}`)
      }
      // 生データをとっておく
      const raw = {
        candles: ins.candles,
        granularity: ins.granularity,
        instrument: ins.instrument
      }
      raws.push(raw)
      // 教師用ローソク足を取得
      const ans = await reader.getCandles(
        param.instrument,
        {
          price: param.price,
          granularity: param.granularity,
          from: to,
          to: ansTo
        }
      )
      const ansCandles = ans.candles
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
        writeJson(raws, 'raw')
        inputs = []
        answers = []
        raws = []
      }
      console.log('start sleep...')
      sleep(param.learnings.sleep)
      console.log('end sleep')
    }
    if (inputs.length > 0) {
      // データを書き込む
      write(inputs, 'input')
      write(answers, 'answer')
      writeJson(raws, 'raw')
    }
  },
  /**
   * @description ローソク足の傾き予測の期間をテストします。
   * @returns {void}
   */
  testLearnSpan () {
    // パラメータを取得
    const param = getParam()

    // 期間指定
    const moment = require('moment')
    const now = moment()
    let from = moment().subtract(param.learnings.from, 'M').format()
    let to = moment(from).add(param.from, 'm').format()
    let ansTo = moment(to).add(param.learnings.answer, 'h').format()
    let diff = now.diff(ansTo)
    const slideRange = param.from / 3
    let i = 0
    while (diff > 0) {
      from = moment(from).add(slideRange, 'm').format()
      to = moment(from).add(param.from, 'm').format()
      ansTo = moment(to).add(param.learnings.answer, 'h').format()
      diff = now.diff(ansTo)
      console.log(diff)
      i++
      if (i % 1000 === 0) {
        console.log(`${i} now writing...`)
      }
    }
    console.log(`learn span is ${i}`)
  }
}
/**
 * @description パラメータを取得します。
 * @returns {Object} パラメータ
 */
function getParam () {
  return require('@h/yml-helper')
    .read('analytics/candle-slope.yml')
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
 * @description JSONデータの書き込みを行います。
 * @param {Array} data - データ
 * @param {String} prefix - ファイル名のプレフィックス
 */
function writeJson (data, prefix) {
  const fs = require('fs')
  fs.appendFileSync(`resources/learnings/${prefix}.json`
    , JSON.stringify(data, null, '  ')
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
