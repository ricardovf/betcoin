const table   = require('../../../lib/util/cli/table.js')
const logger  = require('../../../lib/util/cli/logger.js')
const betcoin = require('../../../lib/betcoin/index')
const colors  = require('colors/safe')
const R       = require('ramda')

const hashRegExp = /^[a-zA-Z0-9]{4,}$/

module.exports = function (vorpal) {
  vorpal
    .command('events [options]', 'See all the events on the blockchain. Options: all (default) or by id')
    .alias('e')
    .action(function (args, callback) {
      let events = betcoin.eventsManager.getAllEvents()

      if (!events || events.length === 0) {
        logger.log(colors.red('No events found!'))
      } else {
        if (args.options && hashRegExp.test(args.options)) {
          // Fetch by id
          let event = betcoin.eventsManager.getEventById(args.options)
          if (!event) {
            logger.log(`No event with id ${args.options} was found!`)
          } else {
            logger.log(colors.blue(`Showing the event by id:`))
            table.logEvents([event])
          }
        } else {
          // Show all the events
          logger.log(colors.blue(`Showing all the events:`))
          table.logEvents(events)
        }
      }

      callback()
    })
}
