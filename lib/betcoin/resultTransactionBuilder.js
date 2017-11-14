const R = require('ramda')
const CryptoUtil = require('../util/cryptoUtil')
const CryptoEdDSAUtil = require('../util/cryptoEdDSAUtil')
const ArgumentError = require('../util/argumentError')
const Transaction = require('../blockchain/transaction')

class ResultTransactionBuilder {
  constructor () {
    this._eventId = null
    this._betType = null
    this._result = null
  }

  eventId (eventId) {
    this._eventId = eventType
    return this
  }

  betType (betType) {
    this._betType = betType
    return this
  }

  result (result) {
    this._result = result
    return this
  }

  build () {
    return Transaction.fromJson({
      id: CryptoUtil.randomId(64),
      hash: null,
      type: 'result',
      data: {
        event: this._eventId,
        betType: this._betType,
        result: this._result
      }
    })
  }

}

module.exports = ResultTransactionBuilder