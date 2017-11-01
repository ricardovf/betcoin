const logger = require('../../../lib/util/cli/logger.js')
const vorpal = require('vorpal')()

module.exports = function (vorpal) {
  logger.log('👋  Bem vindo ao betcoin, interfacer!')
  vorpal.exec('help').then(() => {
    vorpal.exec('open 9000') // por padrão, abre o interfacer na porta 9000
  })
}
