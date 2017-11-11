const R                  = require('ramda')
const Transaction = require('../blockchain/transaction');
const BetTransactionBuilder = require('./betTransactionBuilder')

/*
TODO: documentar
*/

class BetsManager {
  constructor (blockchain, operator, logger) {
    this.logger = logger || console

    this.blockchain = blockchain
    this.operator   = operator
  }

  getAllBets() {
    return R.filter(R.propEq('type', 'bet'), R.flatten(R.pluck('transactions')(this.blockchain.getAllBlocks())))
  }

  getBetById(id) {
    return R.find(R.propEq('id', id))(this.getAllBets())
  }

  /**
   * @param eventType
   * @param betType
   * @param date
   * @param teams
   * @throws
   */
  addBet(betEvent, betType, betOn, walletId, fromAddressId, amount, changeAddressId) {
    amount = parseInt(amount)
    let utxo   = this.blockchain.getUnspentTransactionsForAddress(fromAddressId)
    let wallet = this.operator.getWalletById(walletId)

    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let secretKey = wallet.getSecretKeyByAddress(fromAddressId)

    if (secretKey == null) throw new ArgumentError(`Secret key not found with Wallet id '${walletId}' and address '${fromAddressId}'`)

    let txb = new BetTransactionBuilder(betEvent, betType, betOn)
    txb.from(utxo)
    txb.amount(amount)
    txb.change(changeAddressId || fromAddressId)
    txb.fee(1)
    txb.sign(secretKey)

    return this.blockchain.addTransaction(Transaction.fromJson(txb.build()))
  }
}

module.exports = BetsManager