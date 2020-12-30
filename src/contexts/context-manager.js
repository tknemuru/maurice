'use strict'

/**
 * @description 設定情報の管理機能を提供します。
 */
module.exports = {
  /**
   * @description 設定ファイル配置ディレクトリ
   */
  ConfigDir: 'resources/configs',
  /**
   * @description 設定情報
   */
  config: null,
  /**
   * @description コンテキスト
   */
  context: null,
  /**
   * ストリーミング用コンテキスト
   */
  streamingContext: null,
  /**
   * @description コンテキストを取得します。
   * @returns {Object} コンテキスト
   */
  getContext () {
    if (!module.exports.context) {
      module.exports._initContext()
    }
    return module.exports.context
  },
  /**
   * @description ストリーミング用コンテキストを取得します。
   * @returns {Object} ストリーミング用コンテキスト
   */
  getStreamingContext () {
    if (!module.exports.streamingContext) {
      module.exports._initContext()
    }
    return module.exports.streamingContext
  },
  /**
   * @description 設定情報の初期化を行います。
   * @returns {void}
   */
  _initConfig () {
    const fs = require('fs')
    const yaml = require('js-yaml')
    module.exports.config = yaml.safeLoad(
      fs.readFileSync(
        module.exports.ConfigDir,
        'utf8'
      )
    )
    console.log(module.exports.config)
  },
  /**
   * @description コンテキストの初期化を行います。
   * @returns {void}
   */
  _initContext () {
    if (!module.exports.config) {
      module.exports._initConfig()
    }
    const Context = require('@oanda/v20/context').Context
    module.exports.context = new Context(
      module.exports.config.hostname,
      module.exports.config.port,
      module.exports.config.ssl,
      'oanda context'
    )
    module.exports.streamingContext = new Context(
      module.exports.config.streamingHostname,
      module.exports.config.port,
      module.exports.config.ssl,
      'oanda streaming context'
    )
  }
}
