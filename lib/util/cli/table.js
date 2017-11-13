const Table = require('cli-table2')
const logger = require('./logger.js')
const colors = require('colors/safe')
const R = require('ramda')

function logBlockchain (blockchain) {
  blockchain.forEach((block, index) => {
    const table = new Table({
      style: {border: [], header: []},
      wordWrap: true,
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

function logTransactions (transactions) {
  transactions.forEach((transaction, index) => {
    const table = new Table({
      style: {border: [], header: []},
      wordWrap: true,
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
          table.push([`🤑  ${colors.red('Amount')}`, `${output.amount} -> ${output.address}`])
        })
      } else if (['regular', 'bet'].includes(transaction.type)) {
        transaction.data.inputs.forEach((input) => {
          table.push([`➖  ${colors.red('From')}`, `${input.amount} -> ${input.address}`])
        })

        transaction.data.outputs.forEach((output) => {
          table.push([`➕  ${colors.red('To')}`, `${output.amount} -> ${output.address}`])
        })
      }
    }

    logger.log(table.toString())
  })
}

function logWallets (wallets) {
  wallets.forEach((wallet, index) => {
    const table = new Table({
      style: {border: [], header: []},
      wordWrap: true,
      colWidths: [20, 100]
    })

    // title
    table.push([{colSpan: 2, content: colors.green.bold(`⛓  Wallet #${index}`), hAlign: 'center'}])

    table.push([`🔢  ${colors.red('Id')}`, wallet.id])
    table.push([`🤑  ${colors.red('Addresses')}`, R.join('\n', R.map((w) => {
      return `${w.id} (balance: ${w.balance})`
    }, wallet.addresses))])

    logger.log(table.toString())
  })
}

function logEvents (events) {
  events.forEach((event, index) => {
    const table = new Table({
      style: {border: [], header: []},
      wordWrap: true,
      colWidths: [20, 100]
    })

    // title
    table.push([{colSpan: 2, content: colors.green.bold(`Event #${index}`), hAlign: 'center'}])

    if (event.id) {
      table.push([`🔢  ${colors.red('Id')}`, event.id])
    }

    if (event.type) {
      table.push([`🔣  ${colors.red('Type')}`, event.type])

      table.push([`  ${colors.red('Event type')}`, `${event.data.eventType}`])
      table.push([`  ${colors.red('Bet type')}`, `${event.data.betType}`])
      table.push([`  ${colors.red('Date of the event')}`, `${event.data.eventDate}`])
      table.push([`  ${colors.red('Teams')}`, R.join(' vs ', event.data.teams)])
    }

    logger.log(table.toString())
  })
}

function logBets (bets) {
  events.forEach((bet, index) => {
    const table = new Table({
      style: {border: [], header: []},
      wordWrap: true,
      colWidths: [20, 100]
    })

    // title
    table.push([{colSpan: 2, content: colors.green.bold(`Bet #${index}`), hAlign: 'center'}])

    if (bet.id) {
      table.push([`🔢  ${colors.red('Id')}`, bet.id])
    }

    if (bet.type) {
      table.push([`🔣  ${colors.red('Type')}`, bet.type])

      transaction.data.inputs.forEach((input) => {
        table.push([`➖  ${colors.red('From')}`, `${input.amount} -> ${input.address}`])
      })

      transaction.data.outputs.forEach((output) => {
        table.push([`➕  ${colors.red('To')}`, `${output.amount} -> ${output.address}`])
      })

      table.push([`  ${colors.red('')}`, `${event.data.eventType}`])
    }

    logger.log(table.toString())
  })
}

module.exports = {
  logBlockchain,
  logTransactions,
  logWallets,
  logEvents
}
