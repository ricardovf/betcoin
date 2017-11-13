const table = require('../../../lib/util/cli/table.js')
const logger = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../../lib/betcoin/index')
const colors = require('colors/safe')
const R = require('ramda')

const hashRegExp = /^[a-zA-Z0-9]{4,}$/

const projectWallet = (wallet) => {
  return {
    id: wallet.id,
    addresses: R.map((keyPair) => {
      let balance = betcoin.operator.getBalanceForAddress(keyPair.publicKey)

      return {
        id: keyPair.publicKey,
        balance: balance
      }
    }, wallet.keyPairs)
  }
}

module.exports = function (vorpal) {
  vorpal
    .command('wallets [options]', 'See all the wallets available. Options: all (default) or by id')
    .alias('w')
    .action(function (args, callback) {
      let wallets = betcoin.operator.getWallets()

      if (!wallets || wallets.length === 0) {
        logger.log(colors.red('No wallets found!'))
      } else {
        if (args.options && hashRegExp.test(args.options)) {
          // Fetch by id
          let wallet = betcoin.operator.getWalletById(args.options)
          if (!wallet) {
            logger.log(`No wallet with id ${args.options} was found!`)
          } else {
            let projectedWallets = R.map(projectWallet, [wallet])
            logger.log(colors.blue(`Showing the wallet by id:`))
            table.logWallets(projectedWallets)
          }
        } else {
          // Show all the wallets
          let projectedWallets = R.map(projectWallet, wallets)
          logger.log(colors.blue(`Showing all the wallets:`))
          table.logWallets(projectedWallets)
        }
      }

      callback()
    })
}
