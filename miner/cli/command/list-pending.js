const table = require('../../../lib/util/cli/table.js')
const betcoin = require('../../../lib/betcoin/index')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')

module.exports = function (vorpal) {
  vorpal
    .command('pending', 'See the pending transactions that are not yet on the blockchain.')
    .alias('pt')
    .action(function (args, callback) {
      let transactions = betcoin.blockchain.getAllPendingTransactions()

      if (!transactions || transactions.length === 0) {
        logger.log('No pending transactions found!')
      } else {
        logger.log(colors.blue(`Showing all pending transactions:`))
        table.logTransactions(transactions)
      }

      callback()
    })
}
