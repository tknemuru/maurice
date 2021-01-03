'use strict'

/**
 * @module 計算補助機能を提供します。
 */
module.exports = {
  /**
   * @description 合計を求めます。
   * @param {Array} objs - オブジェクトのリスト
   * @param {Key} key - 計算対象のキー
   * @returns {Number} 合計値
   */
  sumByKey (objs, key) {
    const vals = objs.map(o => o[key])
    return module.exports.sum(vals)
  },
  /**
   * @description 合計を求めます。
   * @param {Array} vals - 値のリスト
   * @returns {Number} 合計値
   */
  sum (vals) {
    const _ = require('lodash')
    const sum = _.reduce(vals, (sum, val) => sum + val)
    return sum
  },
  /**
   * @description 平均値を求めます。
   * @param {Array} objs - オブジェクトのリスト
   * @param {Key} key - 計算対象のキー
   * @returns {Number} 平均値
   */
  averageByKey (objs, key) {
    const vals = objs.map(o => o[key])
    return module.exports.average(vals)
  },
  /**
   * @description 平均値を求めます。
   * @param {Array} vals - 値のリスト
   * @returns {Number} 平均値
   */
  average (vals) {
    const _ = require('lodash')
    const sum = _.reduce(vals, (sum, val) => sum + val)
    const avg = sum / vals.length
    return avg
  },
  /**
   * @description 偏差値を求めます。
   * @param {Array} vals - 値のリスト
   * @returns {Number} 偏差値
   */
  standardScore (vals) {
    const avg = module.exports.average(vals)
    const sd = Math.sqrt(
      vals
        .map((current) => {
          const difference = current - avg
          return difference ** 2
        })
        .reduce((previous, current) =>
          previous + current
        ) / vals.length
    )
    const ss = vals.map(val => (10 * (val - avg) / sd) + 50)
    return ss
  }
}
