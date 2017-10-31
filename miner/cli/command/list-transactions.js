const table   = require('../util/table.js')
const logger  = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../betcoin')
const R = require('ramda')
const colors = require('colors/safe')

const idRegExp   = /^[0-9]+$/
const hashRegExp = /^[a-zA-Z0-9]{4,}$/

module.exports = function (vorpal) {
  vorpal
    .command('transactions [options]', 'See the transactions that are on the blockchain. Options: all (a), latest (default), by block id or hash, by transaction index or hash')
    .alias('t')
    .action(function (args, callback) {
      let lastBlock = betcoin.blockchain.getLastBlock()

      if ( ! lastBlock) {
        logger.log('No transactions found, the blockchain is empty!')
      } else {
        if (args.options === 'all' || args.options === 'a') {
          // Fetch all the transactions
          let transactions = R.flatten(R.pluck('transactions')(betcoin.blockchain.getAllBlocks()))

          logger.log(colors.blue(`Showing all the transactions:`))
          table.logTransactions(transactions)
        } else if (args.options === 0 || (args.options && idRegExp.test(args.options))) {
          // Fetch by id
          let block = betcoin.blockchain.getBlockByIndex(args.options)
          if ( ! block) {
            logger.log(`No block with id ${args.options} was found!`)
          } else {
            logger.log(colors.blue(`Showing transactions on the block #${block.index}:`))
            table.logTransactions(block.transactions)
          }
        } else if (args.options && hashRegExp.test(args.options)) {
          // Fetch by hash or index
          let block = betcoin.blockchain.getBlockByHash(args.options)
          if (block) {
            logger.log(colors.blue(`Showing transactions on the block #${block.index}:`))
            table.logTransactions(block.transactions)
          } else {
            let transaction = betcoin.blockchain.getTransactionFromBlocksById(args.options)

            if ( ! transaction) {
              transaction = betcoin.blockchain.getTransactionFromBlocksByHash(args.options)
            }

            if ( ! transaction) {
              logger.log(`No block or transaction with hash/index ${args.options} was found!`)
            } else {
              logger.log(colors.blue('Showing transaction by block or transaction hash/index:'))
              table.logTransactions([transaction])
            }
          }
        } else {
          logger.log(colors.blue('Showing latest transaction:'))
          table.logTransactions(lastBlock.transactions)
        }
      }

      callback()
    })
}
