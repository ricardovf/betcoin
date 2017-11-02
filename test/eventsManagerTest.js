require('mocha-steps')

const supertest     = require('supertest')
const assert        = require('assert')
const should        = require('should')
const HttpServer    = require('../lib/httpServer')
const Blockchain    = require('../lib/blockchain')
const Transaction    = require('../lib/blockchain/transaction')
const Operator      = require('../lib/operator')
const Miner         = require('../lib/miner')
const Node          = require('../lib/node')
const Block         = require('../lib/blockchain/block')
const EventsManager = require('../lib/betcoin/eventsManager')
const fs            = require('fs-extra')

const logger = require('../lib/util/cli/logger.js')

describe('EventsManager test', function () {
  let blockchain, operator, miner, eventsManager
  let name     = 'events_manager_test'
  let password = '1 2 3 4 5'

  beforeEach(function () {
    fs.removeSync('data/' + name + '/')
    blockchain    = new Blockchain(name, logger)
    operator      = new Operator(name, blockchain, logger)
    miner         = new Miner(blockchain, logger)
    eventsManager = new EventsManager(blockchain, operator, logger)
  })

  describe('addEvent()', function () {
    it('should return an exception if there is only one team defined', function () {
      (() => {
        eventsManager.addEvent('soccer', 'winner', '20/11/2017 20:45', ['Avai'])
      }).should.throw()
    })

    it('should add an event to the blockchain with success', function () {
      eventsManager.addEvent('soccer', 'winner', '20/11/2017 20:45', ['Avai', 'Figueira']).should.be.instanceof(Transaction)
    })
  })

  describe('getAllEvents()', function () {
    it('should be empty if there is no event', function () {
      eventsManager.getAllEvents().should.be.an.Array().and.be.empty()
    })

    it('should return the events after been mined with events added', function () {
      let transaction = eventsManager.addEvent('soccer', 'winner', '20/11/2017 20:45', ['Avai', 'Figueira'])

      transaction.should.be.instanceof(Transaction)

      return miner.mine('')
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          eventsManager.getAllEvents().should.be.an.Array().and.not.be.empty()
        })
    })

    it('should return the correct event after been mined with events added', function () {
      let transaction = eventsManager.addEvent('soccer', 'winner', '20/11/2017 20:45', ['Avai', 'Figueira'])

      transaction.should.be.instanceof(Transaction)

      return miner.mine('')
        .then((newBlock) => {
          newBlock = Block.fromJson(newBlock)
          blockchain.addBlock(newBlock)

          eventsManager.getEventById(transaction.id).should.be.deepEqual(transaction)
        })
    })
  })
})