const Table  = require('cli-table2')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')

function logBlockchain (blockchain) {
  blockchain.forEach((block, index) => {
    const table  = new Table({
      style    : {border: [], header: []},
      wordWrap : true,
      colWidths: [20, 100]
    })
    const object = JSON.parse(JSON.stringify(block))
    for (let key in object) {
      if (key === 'index') {
        const blockNumber = object[key]
        if (blockNumber === 0) {
          table.push([{colSpan: 2, content: colors.green.bold('🏆  Genesis Block'), hAlign: 'center'}])
        } else {
          table.push([{colSpan: 2, content: colors.green.bold(`⛓  Block #${object[key]}`), hAlign: 'center'}])
        }
      } else {
        const obj = {}
        if (key === 'previousHash') {
          obj[`⏮  ${colors.red('Previous Hash')}`] = object[key]
        } else if (key === 'timestamp') {
          obj[`📅  ${colors.red('Timestamp')}`] = new Date(object[key] * 1000).toUTCString()
        } else if (key === 'transactions') {
          obj[`📄  ${colors.red('Transactions')}`] = object[key].length
        } else if (key === 'hash') {
          obj[`📛  ${colors.red('Hash')}`] = object[key]
        } else if (key === 'nonce') {
          obj[`🔨  ${colors.red('Nonce')}`] = object[key]
        }
        if (Object.keys(obj).length) {
          table.push(obj)
        }
      }
    }
    logger.log(table.toString())
  })
}

// @TODO mostrar os detalhes da transação dependendo do tipo (valores, endereços de contas, etc) e também o id do bloco que pertence
function logTransactions (transactions) {
  transactions.forEach((transaction, index) => {
    const table  = new Table({
      style    : {border: [], header: []},
      wordWrap : true,
      colWidths: [20, 100]
    })
    const object = JSON.parse(JSON.stringify(transaction))
    table.push([{colSpan: 2, content: colors.green.bold(`Transaction #${index}`), hAlign: 'center'}])
    for (let key in object) {
      const obj = {}
      if (key === 'hash') {
        obj[`📛  ${colors.red('Hash')}`] = object[key]
      } else if (key === 'id') {
        obj[`🔢  ${colors.red('Id')}`] = object[key]
      } else if (key === 'type') {
        obj[`✳  ${colors.red('Type')}`] = object[key]
      }
      if (Object.keys(obj).length) {
        table.push(obj)
      }
    }
    logger.log(table.toString())
  })
}

module.exports = {
  logBlockchain,
  logTransactions
}
