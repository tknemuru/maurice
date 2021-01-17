'use strict'

const fs = require('fs')

/**
 * @description jsonファイルの取り扱いに関する補助機能を提供します。
 */
module.exports = {
  /**
   * @description jsonファイルを読み込みます。
   * @param {String} path - resources配下のパス
   * @returns {Object} jsonの読み込み結果
   */
  read (path) {
    const src = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    return src
  },
  /**
   * @description ESクエリjsonを読み込みます。
   * @param {String} fileName ファイル名
   * @param {Object} param パラメータ
   * @returns {String} ESクエリjsonの読み込み結果
   */
  readEsQuery (fileName, param) {
    let queryStr = fs.readFileSync(`resources/elasticsearch/querys/${fileName}.json`, { encoding: 'utf-8' })
    const qParam = toParam(param)
    for (const key in qParam) {
      queryStr = queryStr.replace(key, qParam[key])
    }
    return queryStr
  }
}

/**
 * @description オブジェクトをパラメータ形式に変換します。
 * @param {Object} obj - オブジェクト
 * @returns {Object} パラメータ
 */
function toParam (data) {
  const param = {}
  const keys = Object.keys(data)
  for (const key of keys) {
    param[`$${key}`] = data[key]
  }
  return param
}
