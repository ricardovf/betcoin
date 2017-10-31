const vorpal = require('vorpal')()

module.exports = function (vorpal) {
  vorpal
    .use(require('./command/list-wallets.js'))
    .use(require('./command/add-wallet.js'))
    .use(require('./command/add-address.js'))
    .use(require('./command/list-blockchain.js'))
    .use(require('./command/list-transactions.js'))
    .use(require('./command/open-port.js'))
    .use(require('./command/connect-peer.js'))
    .use(require('./command/list-peers.js'))
    .use(require('./command/welcome.js'))
    .delimiter('betcoin (interfacer) →')
    .show()
}