'use strict'

/**
 * @description OandaAPIへの接続機能を提供します。
 */
module.exports = {
  /**
   * @description アカウント情報を取得します。
   * @returns {Object} アカウント情報
   */
  getAccount () {
    const manager = require('@/context-manager')
    const config = manager.getConfig()
    const context = manager.getContext()
    context.account.get(
      config.activeAccount,
      response => {
        require('@h/rest-helper').handleErrorResponse(response)
        const { account } = response.body
        console.log(account.toString())
      }
    )
  },
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
