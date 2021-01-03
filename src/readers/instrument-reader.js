'use strict'

/**
 * @description instrumentの読み取り機能を提供します。
 */
module.exports = {
  /**
   * @description ローソク情報を取得します。
   * @param {String} instrument 銘柄
   * @param {Object} param パラメータ
   * @returns {Object} ローソク情報
   */
  getCandles (instrument, param) {
    const manager = require('@/context-manager')
    const context = manager.getContext()
    return new Promise((resolve, reject) => {
      context.instrument.candles(
        instrument,
        param,
        response => {
          require('@h/rest-helper').handleErrorResponse(response, reject)
          return resolve(response.body)
        }
      )
    })
  }
}
