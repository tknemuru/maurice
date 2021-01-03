'use strict'

/**
 * @description アカウントの読み取り機能を提供します。
 */
module.exports = {
  /**
   * @description アカウント情報を取得します。
   * @returns {Object} アカウント情報
   */
  get () {
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
  }
}
