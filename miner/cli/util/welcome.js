const logger = require('./logger.js');
const vorpal = require('vorpal')();

module.exports = function (vorpal) {
  logger.log("👋  Bem vindo ao betcoin, minerador!");
  vorpal.exec("help")
}
