const logger = require('../../../lib/util/cli/logger.js')
const vorpal = require('vorpal')()

module.exports = function (vorpal) {
  logger.log('👋  Bem vindo ao betcoin, minerador!')
  vorpal.exec('help').then(() => {
    vorpal.exec('open 8000') // por padrão, abre o miner na porta 8000
  })
}
