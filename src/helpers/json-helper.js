'use strict'

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
    const fs = require('fs')
    const src = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))
    return src
  }
}
