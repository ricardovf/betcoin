const Table  = require('cli-table2')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')
const R      = require('ramda')

function logBlockchain (blockchain) {
  blockchain.forEach((block, index) => {
    const table = new Table({
      style    : {border: [], header: []},
      wordWrap : true,
      colWidths: [20, 100]
    })

    // title
    if (block.index === 0) {
      table.push([{colSpan: 2, content: colors.green.bold('🏆  Genesis Block'), hAlign: 'center'}])
    } else {
      table.push([{colSpan: 2, content: colors.green.bold(`⛓  Block #${block.index}`), hAlign: 'center'}])
    }

    table.push([`📅  ${colors.red('Timestamp')}`, new Date(block.timestamp * 1000).toUTCString()])
    table.push([`📛  ${colors.red('Hash')}`, block.hash])
    table.push([`🔨  ${colors.red('Nonce')}`, block.nonce])
    table.push([`⏮  ${colors.red('Previous Hash')}`, block.previousHash])

    if (block.transactions) {
      table.push([`📄  ${colors.red('Transactions')}`, R.join('\n', R.map(R.prop('id'), block.transactions))])
    }

    logger.log(table.toString())
  })
}

// @TODO mostrar os detalhes da transação dependendo do tipo (valores, endereços de contas, etc) e também o id do bloco que pertence
function logTransactions (transactions) {
  transactions.forEach((transaction, index) => {
    const table = new Table({
      style    : {border: [], header: []},
      wordWrap : true,
      colWidths: [20, 100]
    })

    // title
    table.push([{colSpan: 2, content: colors.green.bold(`Transaction #${index}`), hAlign: 'center'}])

    if (transaction.hash) {
      table.push([`📛  ${colors.red('Hash')}`, transaction.hash])
    }

    if (transaction.id) {
      table.push([`🔢  ${colors.red('Id')}`, transaction.id])
    }

    if (transaction.type) {
      table.push([`🔣  ${colors.red('Type')}`, transaction.type])

      if (['reward', 'fee'].includes(transaction.type) && transaction.data.outputs) {
        transaction.data.outputs.forEach((output) => {
          table.push([`🤑  ${colors.red('Amount')}`, output.amount])
        })
      }
    }

    logger.log(table.toString())
  })
}

module.exports = {
  logBlockchain,
  logTransactions
}
