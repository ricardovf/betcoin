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
    .command('add-event', 'Adds a new event.')
    .action(function (args, callback) {
      return this.prompt([
        {
          type: 'list',
          name: 'eventType',
          message: 'Qual é o tipo de evento que você quer adicionar?',
          choices: ['soccer']
        },
        {
          type: 'list',
          name: 'betType',
          message: 'Qual é o tipo de aposta disponível nesse evento?',
          choices: ['winner']
        },
        {
          type: 'input',
          name: 'datetime',
          message: 'Em qual data e horário o evento irá acontecer (dd/mm/yyyy hh:mm)? ',
        },
        {
          type: 'input',
          name: 'teamA',
          message: 'Informe o nome do primeiro time participante: ',
        },
        {
          type: 'input',
          name: 'teamB',
          message: 'Informe nome do segundo time participante: ',
        }
      ], (result) => {
        try {
          // check if all fields are ok
          // check if the event is not already in the blockchain

          let newEvent = betcoin.blockchain.addTransaction(betcoin.eventsManager.createEvent(result.eventType, result.betType, result.datetime, [result.teamA, result.teamB]))

          logger.log(colors.blue(`O evento ${newEvent.id} foi adicionado com sucesso!`))
        } catch (ex) {
          if (ex instanceof ArgumentError || ex instanceof TransactionAssertionError)
            logger.log(colors.red(ex.message))
          else
            throw ex
        }

        callback()
      })
    })
}
