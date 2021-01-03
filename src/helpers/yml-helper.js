'use strict'

/**
 * @description ymlファイルの取り扱いに関する補助機能を提供します。
 */
module.exports = {
  /**
   * @description ymlファイルを読み込みます。
   * @param {String} path - resources配下のパス
   * @returns {Object} ymlの読み込み結果
   */
  read (path) {
    const fs = require('fs')
    const yaml = require('js-yaml')
    const src = yaml.safeLoad(
      fs.readFileSync(
        `resources/${path}`,
        'utf8'
      )
    )
    console.log(src)
    return src
  }
}
