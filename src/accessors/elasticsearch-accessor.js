'use strict'

const context = require('@/context-manager')
const { Client } = require('@elastic/elasticsearch')
let _client

/**
 * @description Elasticsearchへの接続機能を提供します。
 */
module.exports = {
  /**
   * @description Elasticsearchクライアントを取得します。
   * @returns Elasticsearchクライアント
   */
  getClient () {
    return _getClient()
  },
  /**
   * @description 検索を実行します。
   * @param {String} index - インデックス名
   * @param {Object} param - パラメータ
   * @returns {Array} 実行結果
   */
  async search (index, param) {
    let _param = {
      index,
      size: getParam().maxSearchSize
    }
    if (param) {
      _param = Object.assign(
        _param,
        param
      )
    }
    const client = _getClient()
    const result = await client.search(_param)
    return result
  },
  /**
   * @description bulkによるupsertを実行します。
   * @param {String} index - インデックス名
   * @param {Array} datasource - データソース
   * @returns {Object} 実行結果
   */
  async bulkUpsert (index, datasource) {
    const client = _getClient()
    const result = await client.helpers.bulk({
      datasource,
      onDocument (doc) {
        return [
          { update: { _index: index, _id: doc.id } },
          { doc_as_upsert: true }
        ]
      }
    })
    return result
  }
}

/**
 * @description クライアントを取得します。
 * @returns {Object} クライアント
 */
function _getClient () {
  if (!_client) {
    initClient()
  }
  return _client
}

/**
 * @description クライアントの初期化を行います。
 * @returns {void}
 */
function initClient () {
  _client = new Client(getParam())
}

/**
 * @description パラメータを取得します。
 * @returns {Object} パラメータ
 */
function getParam () {
  return context.getConfig().elasticsearch
}
