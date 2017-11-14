const betcoin = require('../../../lib/betcoin/index')
const logger = require('../../../lib/util/cli/logger.js')
const colors = require('colors/safe')
const R = require('ramda')
const CryptoUtil = require('../../../lib/util/cryptoUtil')
const Transaction = require('../../../lib/blockchain/transaction')
const TransactionAssertionError = require('../../../lib/blockchain/transactionAssertionError')
const ArgumentError = require('../../../lib/util/argumentError')

module.exports = function (vorpal) {
  vorpal
    .command('add-result', 'Adds a new result.')
    .action(function (args, callback) {

      let events = betcoin.eventsManager.getAllEvents()
      let eventsAddresses = R.map(R.prop('id'), events)

      if (!events || events.length === 0) {
        logger.log(colors.red('Não há eventos para apostar.'))
        callback()
      } else {

        return this.prompt([{
          type: 'list',
          name: 'resultEvent',
          message: 'De qual evento é o resultado?',
          choices: eventsAddresses
        }, {
          type: 'list',
          name: 'resultBetType',
          message: 'Qual é o tipo do resultado?',
          choices: ['winner']
        }, {
          type: 'input',
          name: 'result',
          message: 'Qual é o resutlado? ',
        }], (result) => {
          try {

            let newResult = betcoin.blockchain.addTransaction(betcoin.resultsManager.createResult(result.resultEvent, result.resultBetType, result.result))

            logger.log(colors.blue(`O resultado ${newResult.id} foi adicionado com sucesso!`))
          } catch (ex) {
            if (ex instanceof ArgumentError || ex instanceof TransactionAssertionError)
              logger.log(colors.red(ex.message))
            else
              throw ex
          }

          callback()
        })

      }
    })
}
