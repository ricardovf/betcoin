require('mocha-steps')

const supertest = require('supertest')
const assert = require('assert')
const should = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator = require('../lib/operator')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const Block = require('../lib/blockchain/block')
const fs = require('fs-extra')

const ResultsManager = require('../lib/betcoin/resultsManager')

const logger = require('../lib/util/cli/logger.js')

describe('Operator', function () {
  let blockchain, operator, miner
  let name = 'operator_test'
  let password = '1 2 3 4 5'

  beforeEach(function () {
    fs.removeSync('data/' + name + '/')
    blockchain = new Blockchain(name, logger)
    operator = new Operator(name, blockchain, logger)
    miner = new Miner(blockchain, new ResultsManager(blockchain, operator, logger), logger)
  })

  describe('getAddressesWithPositiveBalance()', function () {
    it('should return an empty list when there is no address', function () {
      operator.getWallets().should.be.an.Array().and.be.empty()
      operator.getAddressesWithPositiveBalance().should.be.an.Array().and.be.empty()
    })

    it('should return an empty list when there is wallets and addresses without positive balance', function () {
      let newWallet = operator.createWalletFromPassword(password)
      let newAddress = operator.generateAddressForWallet(newWallet.id)

      operator.getWallets().should.be.an.Array().and.not.be.empty()
      operator.getAddressesWithPositiveBalance().should.be.an.Array().and.be.empty()
    })

    it('should return an list with addresses with positive balance', function () {
      let newWallet = operator.createWalletFromPassword(password)
      let newAddress = operator.generateAddressForWallet(newWallet.id)
      let newAddress1 = operator.generateAddressForWallet(newWallet.id)

      return miner.mine(newAddress)
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          operator.getWallets().should.be.an.Array().and.not.be.empty()
          operator.getAddressesWithPositiveBalance().should.be.an.Array().and.not.be.empty()
          operator.getAddressesWithPositiveBalance()[0].should.be.equal(newAddress)
        })
    })
  })

  describe('getAllAddresses()', function () {
    it('should return an empty list when there is no address', function () {
      operator.getWallets().should.be.an.Array().and.be.empty()
      operator.getAllAddresses().should.be.an.Array().and.be.empty()
    })

    it('should return an list with all the addresses', function () {
      let newWallet = operator.createWalletFromPassword(password)
      let newAddress = operator.generateAddressForWallet(newWallet.id)
      let newAddress1 = operator.generateAddressForWallet(newWallet.id)

      return miner.mine(newAddress)
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          operator.getWallets().should.be.an.Array().and.not.be.empty()
          operator.getAllAddresses().should.be.an.Array().and.not.be.empty()
          operator.getAllAddresses()[0].should.be.equal(newAddress)
          operator.getAllAddresses()[1].should.be.equal(newAddress1)
        })
    })
  })

  describe('getWalletByAddress()', function () {
    it('should return null when there is no wallet on the address', function () {
      let newWallet = operator.createWalletFromPassword(password)
      let newAddress = operator.generateAddressForWallet(newWallet.id)

      should(operator.getWalletByAddress()).be.null()
    })

    it('should return the correct wallet id of the address', function () {
      let newWallet = operator.createWalletFromPassword(password)
      let newAddress = operator.generateAddressForWallet(newWallet.id)
      let newAddress1 = operator.generateAddressForWallet(newWallet.id)

      operator.getWalletByAddress(newAddress).should.be.equal(newWallet.id)
      operator.getWalletByAddress(newAddress1).should.be.equal(newWallet.id)
    })
  })
})