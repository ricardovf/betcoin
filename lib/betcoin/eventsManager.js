const R = require('ramda')
const moment = require('moment')
const Transaction = require('../blockchain/transaction')
const EventTransactionBuilder = require('./eventTransactionBuilder')

/*
Event is a transaction with type event, and the data field contains all the details of the event:
{
    "id": "84286bba8d...7477efdae1", // random id (64 bytes)
    "hash": "f697d4ae63...c1e85f0ac3", // hash taken from the contents of the transaction: sha256 (id + data) (64 bytes)
    "type": "event",
    "data":
    {
      "eventType" : 'soccer',
      "betType"   : 'winner',
      "eventDate" : "20/11/2017 20:00"
      "teams"     : ['Figueira', 'Avaí']
    }
}
*/

class EventsManager {
  constructor (blockchain, operator, logger) {
    this.logger = logger || console

    this.blockchain = blockchain
    this.operator = operator
  }

  getAllEvents () {
    return R.filter(R.propEq('type', 'event'), R.flatten(R.pluck('transactions')(this.blockchain.getAllBlocks())))
  }

  getEventById (id) {
    return R.find(R.propEq('id', id))(this.getAllEvents())
  }

  createEvent (eventType, betType, date, teams) {
    let tx = new EventTransactionBuilder()
    tx.eventType(eventType)
    tx.betType(betType)
    tx.date(date)
    tx.teams(teams)

    return Transaction.fromJson(tx.build())
  }
}

module.exports = EventsManager