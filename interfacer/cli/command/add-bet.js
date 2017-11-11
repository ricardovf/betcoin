const betcoin = require('../../../lib/betcoin/index')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')
const R = require('ramda')
const CryptoUtil = require('../../../lib/util/cryptoUtil')
const Transaction = require('../../../lib/blockchain/transaction')
const TransactionAssertionError = require('../../../lib/blockchain/transactionAssertionError')
const ArgumentError = require('../../../lib/util/argumentError')

module.exports = function(vorpal) {
  vorpal
    .command('add-bet', 'Adds a new bet.')
    .action(function(args, callback) {

      let events = betcoin.eventsManager.getAllEvents()
      let eventsAddresses = R.map(R.prop('id'), events)

      if (!events || events.length === 0) {
        logger.log(colors.red('Não há eventos para apostar.'))
        callback()
      } else {

        let addressesWithBalance = betcoin.operator.getAddressesWithPositiveBalance()
        let allAddresses = betcoin.operator.getAllAddresses()

        if (!addressesWithBalance || addressesWithBalance.length === 0) {
          logger.log(colors.red('Can not make any transfer, no addresses with positive balance found!'))
          callback()
        } else {

          return this.prompt([{
            type: 'list',
            name: 'betEvent',
            message: 'Em qual evento você quer apostar?',
            choices: eventsAddresses
          }, {
            type   : 'list',
            name   : 'betType',
            message: 'Qual é o tipo de aposta?',
            choices: ['winner']
          }, {
            type: 'input',
            name: 'betOn',
            message: 'Em que você quer apostar? ',
          }, {
            type: 'input',
            name: 'betAmount',
            message: 'Quanto você quer apostar? ',
          }, {
            type: 'list',
            name: 'fromAddress',
            message: 'De qual carteira você quer retirar dinheiro?',
            choices: addressesWithBalance
          }, {
            type: 'input',
            name: 'password',
            message: 'Informe a senha da carteira de origem: ',
          }], (result) => {
            let walletId     = betcoin.operator.getWalletByAddress(result.fromAddress)
            let passwordHash = CryptoUtil.hash(result.password)

            try {
              if (!betcoin.operator.checkWalletPassword(walletId, passwordHash))
                throw new ArgumentError(`Invalid password for wallet '${walletId}'`)

              let newBet = betcoin.blockchain.addTransaction(betcoin.betsManager.createBet(result.betEvent, result.betType, result.betOn, walletId, result.fromAddress, result.betAmount, result.fromAddress))
              logger.log(colors.blue(`A aposta ${newBet.id} foi adicionado com sucesso!`))
            
            } catch (ex) {
              if (ex instanceof ArgumentError || ex instanceof TransactionAssertionError)
                logger.log(colors.red(ex.message))
              else
                throw ex
            }

            callback()
          })

        }
      }
    })
}
