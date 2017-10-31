const table   = require('../../../lib/util/cli/table.js')
const logger  = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../../lib/betcoin/index')
const colors = require('colors/safe')

const idRegExp   = /^[0-9]+$/
const hashRegExp = /^[a-zA-Z0-9]+$/

module.exports = function (vorpal) {
  vorpal
    .command('blockchain [options]', 'See the current state of the blockchain. Options: all (default), latest (l), by block id or hash')
    .alias('b')
    .action(function (args, callback) {
      let lastBlock = betcoin.blockchain.getLastBlock()

      if ( ! lastBlock) {
        logger.log('No blocks found, the blockchain is empty!')
      } else {
        if (args.options === 'latest' || args.options === 'l') {
          // Fetch the latest block
          logger.log(colors.blue(`Showing the latest block:`))
          table.logBlockchain([lastBlock])
        } else if (args.options === 0 || (args.options && idRegExp.test(args.options))) {
          // Fetch by id
          let block = betcoin.blockchain.getBlockByIndex(args.options)
          if ( ! block) {
            logger.log(`No block with id ${args.options} was found!`)
          } else {
            logger.log(colors.blue(`Showing the block by id:`))
            table.logBlockchain([block])
          }
        } else if (args.options && hashRegExp.test(args.options)) {
          // Fetch by hash
          let block = betcoin.blockchain.getBlockByHash(args.options)
          if ( ! block) {
            logger.log(`No block with hash ${args.options} was found!`)
          } else {
            logger.log(colors.blue(`Showing the block by hash:`))
            table.logBlockchain([block])
          }
        } else {
          // Fetch all the blocks
          logger.log(colors.blue(`Showing all the blocks:`))
          table.logBlockchain(betcoin.blockchain.getAllBlocks())
        }
      }

      callback()
    })
}
