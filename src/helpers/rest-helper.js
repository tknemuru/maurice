'use strict'

/**
 * @description REST通信の補助機能を提供します。
 */
module.exports = {
  /**
   * @description エラーレスポンスのハンドリングを行います。
   * @param {Object} response - レスポンス
   * @param {Object} reject - リジェクト
   * @returns {void}
   */
  handleErrorResponse (response, reject) {
    if (response.statusCode.startsWith('2')) { return }
    let s = response.method +
      ' ' + response.path +
      ' ' + response.statusCode
    if (response.statusMessage !== undefined) {
      s += ' ' + response.statusMessage
    }
    console.log(s)
    reject(new Error('HTTP ' + response.statusCode))
  }
}
