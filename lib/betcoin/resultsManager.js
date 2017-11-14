const R = require('ramda')
const Transaction = require('../blockchain/transaction')
const CryptoUtil = require('../util/cryptoUtil')

/*
TODO: documentar
*/

class ResultsManager {
  constructor (blockchain, operator, betsManager, logger) {
    this.logger = logger || console

    this.blockchain = blockchain
    this.operator = operator
    this.betsManager = betsManager
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

  calculateGains (result) {
    let bets = this.betsManager.getBetsByEventAndBetType(result.resultEvent, result.resultBetType)
    let winners = {}
    let totalAmount = 0
    let winnerAmount = 0
    R.forEach((bet) => {
      let amount = bet.data.bet.amount
      if (bet.data.bet.betOn == result.data.result) {
        winners[bet.data.bet.better] = amount
        winnerAmount += amount
      }
      totalAmount += amount
    }, bets)

    let outputs = []
    R.forEachObjIndexed((winner, amount) => {
      outputs.push({
        "amount": totalAmount * amount / winnerAmount,
        "address": winner
      })
    }, winners)

    return Transaction.fromJson({
      id: CryptoUtil.randomId(64),
      hash: null,
      type: 'gain',
      data: {
        outputs : outputs
      }
    })

  }

}

module.exports = ResultsManager