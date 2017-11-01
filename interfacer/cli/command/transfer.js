const betcoin                   = require('../../../lib/betcoin/index')
const logger                    = require('../../../lib/util/cli/logger.js')
const colors                    = require('colors/safe')
const R                         = require('ramda')
const CryptoUtil                = require('../../../lib/util/cryptoUtil')
const Transaction               = require('../../../lib/blockchain/transaction')
const TransactionAssertionError = require('../../../lib/blockchain/transactionAssertionError')
const ArgumentError             = require('../../../lib/util/argumentError')

module.exports = function (vorpal) {
  vorpal
    .command('transfer', 'Transfer money from one wallet address to another.')
    .action(function (args, callback) {
      let addressesWithBalance = betcoin.operator.getAddressesWithPositiveBalance()
      let allAddresses         = betcoin.operator.getAllAddresses()

      if (!addressesWithBalance || addressesWithBalance.length === 0) {
        logger.log(colors.red('Can not make any transfer, no addresses with positive balance found!'))
        callback()
      } else {
        return this.prompt([
          {
            type   : 'list',
            name   : 'fromAddress',
            message: 'De qual carteira você quer retirar dinheiro?',
            choices: addressesWithBalance
          },
          {
            type   : 'list',
            name   : 'toAddress',
            message: 'Para qual carteira você quer enviar dinheiro?',
            choices: allAddresses
          },
          {
            type   : 'input',
            name   : 'amount',
            message: 'Qual valor você quer transferir?',
          },
          {
            type   : 'input',
            name   : 'password',
            message: 'Informe a senha da carteira de origem',
          }
        ], (result) => {
          let walletId     = betcoin.operator.getWalletByAddress(result.fromAddress)
          let passwordHash = CryptoUtil.hash(result.password)

          try {
            if (!betcoin.operator.checkWalletPassword(walletId, passwordHash))
              throw new ArgumentError(`Invalid password for wallet '${walletId}'`)

            let newTransaction = betcoin.operator.createTransaction(walletId, result.fromAddress, result.toAddress, result.amount, result.fromAddress)

            newTransaction.check()

            let transactionCreated = betcoin.blockchain.addTransaction(Transaction.fromJson(newTransaction))
            logger.log(colors.blue(`A transação ${transactionCreated.id} foi adicionada com sucesso!`))
          } catch (ex) {
            if (ex instanceof ArgumentError || ex instanceof TransactionAssertionError)
              logger.log(colors.red(ex.message))
            else
              throw ex
          }

          callback()
        })
      }

      if (args.walletId && args.walletPassword) {

      }
      //
      //callback()
    })
}
