require('mocha-steps')

const supertest = require('supertest')
const assert = require('assert')
const should = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Transaction = require('../lib/blockchain/transaction')
const Operator = require('../lib/operator')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const Block = require('../lib/blockchain/block')
const EventsManager = require('../lib/betcoin/eventsManager')
const ResultsManager = require('../lib/betcoin/resultsManager')
const fs = require('fs-extra')
const moment = require('moment')
// const EventTransactionBuilder = require('../lib/betcoin/eventTransactionBuilder')

const logger = require('../lib/util/cli/logger.js')

describe('EventsManager test', function () {
  let blockchain, operator, miner, eventsManager
  let name = 'events_manager_test'
  let password = '1 2 3 4 5'

  beforeEach(function () {
    fs.removeSync('data/' + name + '/')
    blockchain = new Blockchain(name, logger)
    operator = new Operator(name, blockchain, logger)
    miner = new Miner(blockchain, new ResultsManager(blockchain, operator, logger), logger)
    eventsManager = new EventsManager(blockchain, operator, logger)
  })

  describe('createEvent()', function () {
    it('should return an exception if there is only one team defined', function () {
      (() => {
        eventsManager.createEvent('soccer', 'winner', moment().add(10, 'days'), ['Avai'])
      }).should.throw()
    })

    it('should return an exception if the date is invalid', function () {
      (() => {
        eventsManager.createEvent('soccer', 'winner', '2098711/201 2045', ['Avai', 'Figueira'])
      }).should.throw()
    })

    it('should return an exception if the date is empty', function () {
      (() => {
        eventsManager.createEvent('soccer', 'winner', '', ['Avai', 'Figueira'])
      }).should.throw()
    })

    it('should return an exception if the date is in the past', function () {
      (() => {
        eventsManager.createEvent('soccer', 'winner', moment().subtract(1, 'days'), ['Avai', 'Figueira'])
      }).should.throw()
    })

    it('should create a transaction event with success', function () {
      eventsManager.createEvent('soccer', 'winner', moment().add(1, 'days'), ['Avai', 'Figueira']).should.be.instanceof(Transaction)
    })
  })

  describe('getAllEvents()', function () {
    it('should be empty if there is no event', function () {
      eventsManager.getAllEvents().should.be.an.Array().and.be.empty()
    })

    it('should return the events after been mined with events added', function () {
      let transaction = eventsManager.createEvent('soccer', 'winner', moment().add(10, 'days'), ['Avai', 'Figueira'])
      transaction.should.be.instanceof(Transaction)
      let transactionCreated = blockchain.addTransaction(Transaction.fromJson(transaction))
      transactionCreated.should.be.instanceof(Transaction)

      return miner.mine('')
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          eventsManager.getAllEvents().should.be.an.Array().and.not.be.empty()
        })
    })

    it('should return the correct event after been mined with events added', function () {
      let transaction = eventsManager.createEvent('soccer', 'winner', moment().add(10, 'days'), ['Avai', 'Figueira'])
      transaction.should.be.instanceof(Transaction)
      let transactionCreated = blockchain.addTransaction(Transaction.fromJson(transaction))
      transactionCreated.should.be.instanceof(Transaction)

      return miner.mine('')
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          eventsManager.getEventById(transaction.id).should.be.deepEqual(transaction)
        })
    })
  })
})