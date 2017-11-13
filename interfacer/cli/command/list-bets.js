const table = require('../../../lib/util/cli/table.js')
const logger = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../../lib/betcoin/index')
const colors = require('colors/safe')
const R = require('ramda')

const hashRegExp = /^[a-zA-Z0-9]{4,}$/

module.exports = function (vorpal) {
  vorpal
    .command('bets [eventId]', 'See all the bets on the blockchain. Options: all (default) or by event id')
    .action(function (args, callback) {
      let bets = betcoin.betsManager.getAllBets()
      if (!bets || bets.length === 0) {
        logger.log(colors.red('No bets found!'))
      } else {
        if (args.eventId && hashRegExp.test(args.eventId)) {
          let event = betcoin.eventsManager.getEvebentById(args.eventId)
          if (!event) {
            logger.log(`No event with id ${args.eventId} was found!`)
          } else {
            let bets = betcoin.betsManager.getBetsByEvent(event)
            logger.log(colors.blue(`Showing bets by event id ${args.options}:`))
            table.logBets(bets)
          }
        } else {
          logger.log(colors.blue(`Showing all the events:`))
          table.logBets(bets)
        }
      }
      callback()
    })
}
