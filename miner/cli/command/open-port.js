const logger = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../betcoin')

module.exports = function (vorpal) {
  vorpal
    .command('open <port>', 'Open port to accept incoming connections. Eg: open 2727')
    .alias('o')
    .action(function (args, callback) {
      if (args.port) {
        if (typeof args.port === 'number') {
          betcoin.startServer('localhost', args.port)
        } else {
          logger.log(`❌  invalid port!`)
        }
      }
      callback()
    })
}
