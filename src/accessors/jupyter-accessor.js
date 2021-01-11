'use strict'

// const context = require('@/context-manager')
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
      // console.log(future.done)
      await future.done
        .catch(e => {
          console.log(e)
        })
      // console.log(ret)
      // const future = await client.execute({
      //   code: "print('hello world')"
      // })
      // future.onDone = () => {
      //   console.log('Future is fulfilled')
      // }
      // future.onIOPub = (msg) => {
      //   console.log(msg.content)
      // }
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
  const options = {
    path: 'dev/tknemuru/maurice-learning/hoge-world.ipynb',
    type: 'notebook',
    name: 'hoge-world.ipynb',
    kernel: {
      name: 'python'
    },
    baseUrl: 'http://localhost:8888',
    token: '1c99a1076e094f3643398952ccbab1e2b877e6ad9eaed679'
  }
  const serverSettings = services.ServerConnection.makeSettings(options)
  console.log(serverSettings)
  const kernelManager = new services.KernelManager({ serverSettings })
  const sessionManager = new services.SessionManager({
    kernelManager,
    serverSettings
  })
  _client = await sessionManager.startNew(options)
  // global.XMLHttpRequest = XMLHttpRequest
  // global.WebSocket = WebSocket
  // const Kernel = {}
  // console.log(jupyter)
  // const ajaxSettings = {
  //   requestHeaders: {
  //     Authorization: 'token 807a6ae09df832ace1e268ff1cb603032ea3556f4244f690'
  //   }
  // }
  // const kernelSpecs = await Kernel.getSpecs({
  //   baseUrl: 'http://localhost:8888',
  //   ajaxSettings
  // })
  // console.log('Default spec:', kernelSpecs.default)
  // console.log('Available specs', Object.keys(kernelSpecs.kernelspecs))
  // const options = {
  //   baseUrl: 'http://localhost:8888',
  //   name: kernelSpecs.default,
  //   ajaxSettings,
  //   clientId: '807a6ae09df832ace1e268ff1cb603032ea3556f4244f690'
  // }
  // _client = await Kernel.startNew(options)
}
