const R = require('ramda')
const Transaction = require('../blockchain/transaction')
const ResultTransactionBuilder = require('./betTransactionBuilder')

/*
TODO: documentar
*/

class ResultsManager {
  constructor (blockchain, operator, logger) {
    this.logger = logger || console

    this.blockchain = blockchain
    this.operator = operator
  }

  getAllResults () {
    return R.filter(R.propEq('type', 'result'), R.flatten(R.pluck('transactions')(this.blockchain.getAllBlocks())))
  }

  getResultById (id) {
    return R.find(R.propEq('id', id))(this.getAllResults())
  }

  getByEvent (event) {
    // TODO: implementar
  }

  createResult (resultEvent, resultBetType, result) {
    return Transaction.fromJson({
      id: CryptoUtil.randomId(64),
      hash: null,
      type: 'result',
      data: {
        event: resultEvent,
        betType: resultBetType,
        result: result
      }
    })
  }
}

module.exports = ResultsManager