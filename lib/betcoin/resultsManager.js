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
    return R.filter(RA.lensEq(R.lensPath(['data', 'event']), event))(this.getAllBets())
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

  calculateGainsTransaction (result) {

    let bets = this.betsManager.getBetsByEventAndBetType(result.data.event, result.data.betType)

    let winners = {}
    let totalAmount = 0
    let winnerAmount = 0
    R.forEach((bet) => {
      let amount = bet.data.bet.amount
      if (bet.data.bet.betOn == result.data.result) {
        winners[bet.data.bet.betterAddress] = amount
        winnerAmount += amount
      }
      totalAmount += amount
    }, bets)

    let outputs = []
    R.forEachObjIndexed((amount, winner) => {
      outputs.push({
        "address": winner,
        "amount": totalAmount * amount / winnerAmount
      })
    }, winners)

    return Transaction.fromJson({
      id: CryptoUtil.randomId(64),
      hash: null,
      type: 'gain',
      data: {
        inputs: [],
        outputs: outputs,
        result: result.id
      }
    })

  }

}

module.exports = ResultsManager