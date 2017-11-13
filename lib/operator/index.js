const R = require('ramda')
const Wallets = require('./wallets')
const Wallet = require('./wallet')
const Transaction = require('../blockchain/transaction')
const TransactionBuilder = require('./transactionBuilder')
const Db = require('../util/db')
const ArgumentError = require('../util/argumentError')

const OPERATOR_FILE = 'wallets.json'

class Operator {
  constructor (dbName, blockchain, logger) {
    this.dbName = dbName
    this.logger = logger || console
    this.db = new Db('data/' + this.dbName + '/' + OPERATOR_FILE, new Wallets())

    // INFO: In this implementation the database is a file and every time data is saved it rewrites the file, probably it should be a more robust database for performance reasons
    this.wallets = this.db.read(Wallets)
    this.blockchain = blockchain
  }

  rename (name) {
    if (this.dbName !== name) {
      this.dbName = name
      this.db.rename('data/' + this.dbName + '/' + OPERATOR_FILE)
      this.wallets = this.db.read(Wallets)
    }
  }

  addWallet (wallet) {
    this.wallets.push(wallet)
    this.db.write(this.wallets)
    return wallet
  }

  createWalletFromPassword (password) {
    let newWallet = Wallet.fromPassword(password)
    return this.addWallet(newWallet)
  }

  createWalletFromHash (hash) {
    let newWallet = Wallet.fromHash(hash)
    return this.addWallet(newWallet)
  }

  checkWalletPassword (walletId, passwordHash) {
    let wallet = this.getWalletById(walletId)
    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    return wallet.passwordHash == passwordHash
  }

  getWallets () {
    return this.wallets
  }

  getAllAddresses () {
    return R.map(R.prop('publicKey'), R.flatten(R.map(R.prop('keyPairs'))(this.wallets)))
  }

  getAddressesWithPositiveBalance () {
    let groupAddresses = (keyPair) => {
      let balance = this.getBalanceForAddress(keyPair.publicKey)

      return {
        id: keyPair.publicKey,
        balance: balance
      }
    }

    let filterBalance = (pair) => {
      return pair.balance > 0
    }

    return R.map(R.prop('id'), R.filter(filterBalance, R.map(groupAddresses, R.flatten(R.map(R.prop('keyPairs'))(this.wallets)))))
  }

  getWalletById (walletId) {
    return R.find((wallet) => { return wallet.id == walletId }, this.wallets)
  }

  getWalletByAddress (addressId) {
    let wallet = R.find((wallet) => {
      return R.find((keyPairs) => {
        return keyPairs.publicKey == addressId
      }, wallet.keyPairs)
    }, this.wallets)

    return wallet ? wallet.id : null
  }

  generateAddressForWallet (walletId) {
    let wallet = this.getWalletById(walletId)
    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let address = wallet.generateAddress()
    this.db.write(this.wallets)
    return address
  }

  getAddressesForWallet (walletId) {
    let wallet = this.getWalletById(walletId)
    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let addresses = wallet.getAddresses()
    return addresses
  }

  getAddressForWallet (walletId, addressId) {
    let wallet = this.getWalletById(walletId)
    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let addressFound = wallet.getAddressByPublicKey(addressId)
    if (addressFound == null) throw new ArgumentError(`Address not found with id '${addressId}' for wallet ${walletId}`)

    return addressFound
  }

  getBalanceForAddress (addressId) {
    let utxo = this.blockchain.getUnspentTransactionsForAddress(addressId)
    return R.sum(R.map(R.prop('amount'), utxo))
  }

  createTransaction (walletId, fromAddressId, toAddressId, amount, changeAddressId) {
    amount = parseInt(amount)
    let utxo = this.blockchain.getUnspentTransactionsForAddress(fromAddressId)
    let wallet = this.getWalletById(walletId)

    if (wallet == null) throw new ArgumentError(`Wallet not found with id '${walletId}'`)

    let secretKey = wallet.getSecretKeyByAddress(fromAddressId)

    if (secretKey == null) throw new ArgumentError(`Secret key not found with Wallet id '${walletId}' and address '${fromAddressId}'`)

    let tx = new TransactionBuilder()
    tx.from(utxo)
    tx.to(toAddressId, amount)
    tx.change(changeAddressId || fromAddressId)
    tx.fee(1)
    tx.sign(secretKey)

    return Transaction.fromJson(tx.build())
  }
}

module.exports = Operator