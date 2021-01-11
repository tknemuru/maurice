'use strict'

const context = require('@/context-manager')
const fs = require('fs')
const services = require('@jupyterlab/services')
let _client

/**
 * @description Elasticsearchへの接続機能を提供します。
 */
module.exports = {
  /**
   * @description 検索を実行します。
   * @param {String} index - インデックス名
   * @param {Object} param - パラメータ
   * @returns {Array} 実行結果
   */
  async execute () {
    const client = await getClient()
    try {
      const code = fs.readFileSync('resources/jupyters/pred.py', { encoding: 'utf-8' })
      // const code = "print('hello world')"
      console.log(code)
      const future = client.kernel.requestExecute({ code })
      future.onReply = reply => {
        console.log('Got execute reply')
        // console.log(reply)
      }
      future.onIOPub = reply => {
        console.log('onIOPub')
        console.log(reply)
      }
      await future.done
        .catch(e => {
          console.log(e)
        })
    } catch (e) {
      console.error(e)
    } finally {
      client.kernel.shutdown()
    }
  }
}

/**
 * @description クライアントを取得します。
 * @returns {Object} クライアント
 */
async function getClient () {
  if (!_client) {
    await initClient()
  }
  return _client
}

/**
 * @description クライアントの初期化を行います。
 * @returns {void}
 */
async function initClient () {
  const param = getParam()
  const options = {
    path: param.path,
    type: 'notebook',
    name: param.name,
    kernel: {
      name: 'python'
    },
    baseUrl: param.baseUrl,
    token: param.token
  }
  const serverSettings = services.ServerConnection.makeSettings(options)
  console.log(serverSettings)
  const kernelManager = new services.KernelManager({ serverSettings })
  const sessionManager = new services.SessionManager({
    kernelManager,
    serverSettings
  })
  _client = await sessionManager.startNew(options)
}

/**
 * @description パラメータを取得します。
 * @returns {Object} パラメータ
 */
function getParam () {
  return context.getConfig().jupyter
}
