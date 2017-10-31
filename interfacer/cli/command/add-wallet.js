const betcoin = require('../../../lib/betcoin/index')
const logger  = require('../../../lib/util/cli/logger.js')
const colors  = require('colors/safe')
const R       = require('ramda')

module.exports = function (vorpal) {
  vorpal
    .command('add-wallet <password>', 'Create a new wallet. Password must contain at least 5 words.')
    .alias('aw')
    .action(function (args, callback) {
      let password = args.password || ''
      if (R.match(/\w+/g, password.toString()).length <= 4) {
        logger.log(colors.red('Password must contain at least 5 words!'))
      } else {
        let newWallet = betcoin.operator.createWalletFromPassword(password)

        logger.log(colors.blue(`New wallet created with id ${newWallet.id}`))
      }

      callback()
    })
}
