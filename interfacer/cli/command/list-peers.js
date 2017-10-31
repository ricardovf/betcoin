const betcoin = require('../../../lib/betcoin/index')
const logger = require('../../../lib/util/cli/logger.js')

module.exports = function (vorpal) {
  vorpal
    .command('peers', 'Get the list of connected peers.')
    .alias('p')
    .action(function (args, callback) {
      if (! betcoin.node || betcoin.node.peers.length === 0) {
        logger.log('Not connected to any peer.')
      } else {
        betcoin.node.peers.forEach(function (peer) {
          logger.log(`👤  ${peer.url} \n`)
        })
      }

      callback()
    })
}
