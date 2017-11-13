const betcoin = require('../../../lib/betcoin/index')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')
const R = require('ramda')
const CryptoUtil = require('../../../lib/util/cryptoUtil')

module.exports = function (vorpal) {
  vorpal
    .command('add-address <walletId> <walletPassword>', 'Create a new address on a wallet.')
    .alias('aa')
    .action(function (args, callback) {
      if (args.walletId && args.walletPassword) {
        let walletId = args.walletId
        let password = args.walletPassword
        let passwordHash = CryptoUtil.hash(password)

        if (!betcoin.operator.checkWalletPassword(walletId, passwordHash)) {
          logger.log(colors.red(`Invalid password for wallet ${walletId}`))
        } else {
          let newAddress = betcoin.operator.generateAddressForWallet(walletId)

          logger.log(colors.blue(`New address created with id ${newAddress}`))
        }
      }

      callback()
    })
}
