const R = require('ramda')
const moment = require('moment')
const CryptoUtil = require('../util/cryptoUtil')
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil')
const ArgumentError = require('../util/argumentError')
const Transaction = require('../blockchain/transaction')

const DATE_FORMAT = 'DD/MM/YYYY HH:mm'

class EventTransactionBuilder {
  constructor () {
    this._eventType = null
    this._betType = null
    this._date = null
    this._teams = null
    this._type = 'event'
  }

  eventType (eventType) {
    this._eventType = eventType
    return this
  }

  betType (betType) {
    this._betType = betType
    return this
  }

  date (date) {
    if (date) {
      this._date = moment(date, DATE_FORMAT)
    }

    return this
  }

  teams (teams) {
    this._teams = teams
    return this
  }

  build () {
    if (this._eventType != 'soccer') throw new ArgumentError('Only event of type "soccer" is supported.')
    if (this._betType != 'winner') throw new ArgumentError('Only bet of type "winner" is supported.')
    if (!this._teams instanceof Array || R.uniq(this._teams).length !== 2) throw new ArgumentError('There must be two different teams on the event.')

    if (this._date && !this._date.isValid()) throw new ArgumentError('The date of the event is not valid. The format is: '+DATE_FORMAT)
    if (!this._date.isAfter(moment())) throw new ArgumentError('The date of the event should be in the future: '+DATE_FORMAT)

    return Transaction.fromJson({
      id: CryptoUtil.randomId(64),
      hash: null,
      type: this._type,
      data: {
        eventType: this._eventType,
        betType: this._betType,
        eventDate: this._date.format(DATE_FORMAT),
        teams: this._teams
      }
    })
  }

  static dateFormat() {
    return DATE_FORMAT
  }
}

module.exports = EventTransactionBuilder