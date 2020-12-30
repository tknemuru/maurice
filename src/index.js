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

const accountReader = require('@/account-reader')

switch (options.target) {
  case 'hello':
    console.log('hello world')
    accountReader.get()
    break
  default:
    throw new Error('unexpected target.')
}
