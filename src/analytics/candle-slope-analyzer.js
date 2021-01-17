'use strict'

const context = require('@/context-manager')
const es = require('@acs/elasticsearch-accessor')
const json = require('@h/json-helper')
const sleep = require('thread-sleep')

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
    let validColLength = -1
    const test = false
    // eslint-disable-next-line no-unmodified-loop-condition
    while (diff > 0 && (!test || i < 30)) {
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
          sort: 'time:asc',
          size: param.learnings.inputSize
        }
      )
      const insCandles = result.body.hits.hits.map(h => h._source)
      const input = map(insCandles, param)
      inputs.push(input)
      if (i === 0) {
        validColLength = inputs[0].length
        console.log(`input length is ${validColLength}`)
      }
      // 教師用ローソク足を取得
      body = json.readEsQuery(
        'select-candle',
        {
          granularity: param.granularity,
          instrument: param.instrument,
          from: to,
          to: ansTo
        }
      )
      result = await es.search(
        'candle',
        {
          body,
          sort: 'time:asc',
          size: param.learnings.answerSize
        }
      )
      const ansCandles = result.body.hits.hits.map(h => h._source)
      if (i === 0) {
        console.log(`answer size is ${ansCandles.length}`)
      }
      const answer = map(ansCandles, param)[ansCandles.length - 2]
      if (isValidInput(input, validColLength)) {
        console.log('OK')
        answers.push([answer])
      }
      from = moment(from).add(slideRange, 'm').format()
      to = moment(from).add(param.from, 'm').format()
      ansTo = moment(to).add(param.learnings.answer, 'h').format()
      diff = now.diff(ansTo)
      console.log(diff)
      i++
      if (i % param.learnings.writingUnit === 0) {
        console.log(`${i} now writing...`)
        // データを書き込む
        writeAll(inputs, answers, validColLength)
        inputs = []
        answers = []
      }
    }
    if (inputs.length > 0) {
      // データを書き込む
      writeAll(inputs, answers, validColLength)
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

  // 傾きに変換して桁を変える
  const slopes = rawDatas
    .map((r, i, ar) => {
      if (length - 1 <= i) {
        return -999
      }
      return Math.floor((ar[i + 1] - r) * param.learnings.roundRate)
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
 * @description データの書き込みを行います。
 * @param {Array} inputs - 入力データ
 * @param {Array} answers - 教師データ
 * @param {Number} validColLength - 正しい入力データのカラム数
 * @returns {void}
 */
function writeAll (inputs, answers, validColLength) {
  const rowLen = inputs.length
  if (inputs.length <= 0) {
    return
  }
  let valid = true
  const _inputs = inputs.filter((inp, i) => {
    if (isValidInput(inp, validColLength)) {
      return true
    }
    if (i < rowLen - 1) {
      valid = false
      console.warn(`invalid data i:${i} rowLen:${rowLen} inp.length:${inp.length} validColLength:${validColLength}`)
      sleep(2000)
    }
    return false
  })
  if (!valid) {
    return
  }
  const inLen = _inputs.length
  const _answers = answers.filter((ans, i) => i <= inLen - 1)
  write(_inputs, 'input')
  write(_answers, 'answer')
}

/**
 * @description 入力情報が妥当かどうか
 */
function isValidInput (input, validColLength) {
  if (input.length === validColLength) {
    return true
  } else {
    console.warn(`invalid length input.length:${input.length} validColLength:${validColLength}`)
    return false
  }
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
