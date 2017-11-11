require('mocha-steps')

const supertest  = require('supertest')
const assert     = require('assert')
const should     = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator   = require('../lib/operator')
const Miner      = require('../lib/miner')
const Node       = require('../lib/node')
const Block = require('../lib/blockchain/block')
const fs         = require('fs-extra')
const EventsManager = require('../lib/betcoin/eventsManager')
const BetsManager = require('../lib/betcoin/betsManager')

const logger = require('../lib/util/cli/logger.js')

describe('Bets', function () {
  
  let blockchain, operator, miner, eventsManager, betsManager
  let name     = 'bets_test'
  let password = '1 2 3 4 5'

  let ctx = {}

  beforeEach(function () {
  
    fs.removeSync('data/' + name + '/')
    
    blockchain = new Blockchain(name, logger)
    operator   = new Operator(name, blockchain, logger)
    miner      = new Miner(blockchain, logger)
    eventsManager = new EventsManager(blockchain, operator, logger)
    betsManager = new BetsManager(blockchain, operator, logger)

    ctx.walletId = operator.createWalletFromPassword(password).id
    ctx.address1 = operator.generateAddressForWallet(ctx.walletId)
    ctx.address2 = operator.generateAddressForWallet(ctx.walletId)

    ctx.eventId = eventsManager.createEvent("soccer", "winner", "13/08/2018 12:00", ["sp", "avai"])

    return miner.mine(ctx.address2).then((newBlock) => {
      newBlock = Block.fromJson(newBlock)
      blockchain.addBlock(newBlock)

      return miner.mine(ctx.address1).then((newBlock) => {
        newBlock = Block.fromJson(newBlock)
        blockchain.addBlock(newBlock)
      })

    })

  })

  describe('createBet', function () {
    it('it should alter the account balance', function () {

      betsManager.createBet(ctx.eventId, "winner", "sp", ctx.walletId, ctx.address1, 5000000000/2, ctx.address1)

      return miner.mine(ctx.address2).then((newBlock) => {
        newBlock = Block.fromJson(newBlock)
        blockchain.addBlock(newBlock)

        operator.getBalanceForAddress(ctx.address1).should.be.equal(5000000000/2 - 1)

      })


    })
  })

})