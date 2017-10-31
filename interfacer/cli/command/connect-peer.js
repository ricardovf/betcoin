const betcoin = require('../../../lib/betcoin/index')

module.exports = function (vorpal) {
  vorpal
    .command('connect <host> <port>', 'Connect to a new peer. Eg: connect localhost 2727')
    .alias('c')
    .action(function (args, callback) {
      if (args.host && args.port) {
        betcoin.node.connectToPeer({
          url: `http://${args.host}:${args.port}`
        })
      }
      callback()
    })
}
