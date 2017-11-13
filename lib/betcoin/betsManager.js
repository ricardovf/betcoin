const R = require('ramda')
const RA = require('ramda-adjunct');
const Transaction = require('../blockchain/transaction')
const BetTransactionBuilder = require('./betTransactionBuilder')

/*
Uma transação tipo bet é como uma transação regular mas o seu tipo é bet, e
possui um atributo data.bet:

bet: {
  betEvent: this.betEvent,
  betType: this.betType,
  betOn: this.betOn,
  amount: this.totalAmount
}

*/

class BetsManager {
  constructor (blockchain, operator, logger) {
    this.logger = logger || console

    this.blockchain = blockchain
    this.operator = operator
  }

  getAllBets () {
    return R.filter(R.propEq('type', 'bet'), R.flatten(R.pluck('transactions')(this.blockchain.getAllBlocks())))
  }

  getBetById (id) {
    return R.find(R.propEq('id', id))(this.getAllBets())
  }

  getBetsByEvent (eventId) {
    return R.filter(RA.lensEq(R.lensPath(['data', 'bet', 'betEvent']), eventId))(this.getAllBets())
  }

  getBetsByEventAndBetType (event, type) {
    return R.filter(R.allPass([RA.lensEq(R.lensPath(['data', 'bet', 'betEvent']), event), RA.lensEq(R.lensPath(['data', 'bet', 'betType']), type)]))(this.getAllBets())
  }

  createBet (betEvent, betType, betOn, walletId, fromAddressId, amount) {
    amount = parseInt(amount)
    let utxo = this.blockchain.getUnspentTransactionsForAddress(fromAddressId)
    let wallet = this.operator.getWalletById(walletId)

    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let secretKey = wallet.getSecretKeyByAddress(fromAddressId)

    if (secretKey == null) throw new ArgumentError(`Secret key not found with Wallet id '${walletId}' and address '${fromAddressId}'`)

    let txb = new BetTransactionBuilder(betEvent, betType, betOn)
    txb.from(utxo)
    txb.amount(amount)
    txb.change(fromAddressId)
    txb.fee(1)
    txb.sign(secretKey)

    return Transaction.fromJson(txb.build())
  }
}

module.exports = BetsManager