'use strict'

/**
 * @module CSV入出力の補助機能を提供します。
 */
module.exports = {
  /**
   * @description 配列をCSVに変換します。
   * @param {Array} data - 値のリスト
   * @returns {String} CSV
   */
  toCsv (data) {
    let csv = ''
    for (const rows of data) {
      for (let i = 0; i < rows.length; i++) {
        if (i < rows.length - 1) {
          csv += `${rows[i]},`
        } else {
          csv += `${rows[i]}\n`
        }
      }
    }
    return csv
  }
}
