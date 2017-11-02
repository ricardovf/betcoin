const vorpal = require('vorpal')()

module.exports = function (vorpal) {
  vorpal
    .use(require('./command/list-wallets.js'))
    .use(require('./command/add-wallet.js'))
    .use(require('./command/add-address.js'))
    .use(require('./command/transfer.js'))
    .use(require('./command/list-events.js'))
    .use(require('./command/add-event.js'))
    .use(require('../../miner/cli/command/list-blockchain.js'))
    .use(require('../../miner/cli/command/list-transactions.js'))
    .use(require('../../miner/cli/command/open-port.js'))
    .use(require('../../miner/cli/command/connect-peer.js'))
    .use(require('../../miner/cli/command/list-peers.js'))
    .use(require('./command/welcome.js'))
    .delimiter('betcoin (interfacer) →')
    .show()
}