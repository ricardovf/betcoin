const logger = require('../../../lib/util/cli/logger.js')
const vorpal = require('vorpal')()

module.exports = function (vorpal) {
  logger.log('👋  Bem vindo ao betcoin, minerador!')
  vorpal.exec('help')
}
