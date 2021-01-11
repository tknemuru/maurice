'use strict'

require('module-alias/register')
const args = require('command-line-args')
const optionDefs = [
  {
    name: 'target',
    alias: 't',
    type: String
  }
]
const options = args(optionDefs)
console.log(options)

// const accountReader = require('@/account-reader')
// const instrumnetReader = require('@/instrument-reader')
const accumulater = require('@acm/candle-accumulater')
const analyzer = require('@a/candle-slope-analyzer')

switch (options.target) {
  case 'hello':
    console.log('hello world')
    // accountReader.get()
    // instrumnetReader.getCandles()
    // instrumnetReader.getOrderBook()
    break
  case 'accumulate':
    (async () => {
      try {
        await accumulater.accumulate({
        })
      } catch (e) {
        console.log(e)
      } finally {
        process.exit()
      }
    })()
    break
  case 'predicate':
    (async () => {
      try {
        await analyzer.predicate({
        })
      } catch (e) {
        console.log(e)
      } finally {
        process.exit()
      }
    })()
    break
  case 'learn':
    (async () => {
      try {
        await analyzer.learn({
        })
        // analyzer.testLearnSpan()
      } catch (e) {
        console.log(e)
      } finally {
        process.exit()
      }
    })()
    break
  default:
    throw new Error('unexpected target.')
}
