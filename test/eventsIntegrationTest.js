require('mocha-steps')
const supertest = require('supertest')
const assert = require('assert')
const should = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator = require('../lib/operator')
const EventsManager = require('../lib/betcoin/eventsManager')
const BetsManager = require('../lib/betcoin/betsManager')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const fs = require('fs-extra')
const R = require('ramda')

const logger = require('../lib/util/cli/logger.js')

describe('Events integration Test:', () => {

  const name1 = 'eventsIntegrationTest1'

  let createBetcoin = (name, host, port, peers) => {
    fs.removeSync('data/' + name + '/')
    let blockchain = new Blockchain(name, logger)
    let operator = new Operator(name, blockchain, logger)
    let eventsManager = new EventsManager(blockchain, operator, logger)
    let betsManager = new BetsManager(blockchain, operator, logger)
    let miner = new Miner(blockchain, logger)
    let node = new Node(host, port, peers, blockchain, logger)
    let httpServer = new HttpServer(node, blockchain, operator, eventsManager, betsManager, miner, logger)

    return {
      httpServer,
      eventsManager,
      betsManager,
    }
  }

  const walletPassword = 't t t t t'
  let context = {}

  after('stop servers', () => {
    context.httpServer1 && context.httpServer1.close()
  })

  step('start server', () => {
    let betcoin = createBetcoin(name1, 'localhost', 3001, [])
    context.eventsManager1 = betcoin.eventsManager
    context.betsManager1 = betcoin.betsManager

    return betcoin.httpServer.listen('localhost', 3001)
      .then((httpServer) => {
        context.httpServer1 = httpServer
      })
  })

  step('create wallet', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/operator/wallets')
          .send({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.walletId = res.body.id
      })
  })

  step('create address 1', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/addresses`)
          .set({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.address1 = res.body.address
      })
  })

  step('mine an empty block', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address1})
          .expect(201)
      })
  })

  step('check address 1 first balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 5000000000, `Expected balance of address '${context.address1}' to be '5000000000'`)
          })
      })
  })

  step('create a event', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/events`)
          .send({
            eventType: 'soccer',
            betType: 'winner',
            date: '20/11/2017 20:45',
            teams: ['Avai', 'Figueira']
          })
          .expect(201)
      })
      .then((res) => {
        context.event = res.body;
      })
  })

  step('mine a block with the event', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address1})
          .expect(201)
      })
  })

  step('check if the event was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/events`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 1, `Expected events array size to be '1'`)
            assert.equal(res.body[0].id, context.event.id, `Expected event id to be equal ${context.event.id}`)
          })
      })
  })

  // no fee should be charged on event addition
  step('check if no fee was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/processed-transactions`)
          .expect(200)
          .expect((res) => {
            let feeTransactions = R.filter(R.propEq('type', 'fee'))(res.body)
            assert.equal(feeTransactions.length, 0, `Expect fee transactions array size to be '0'`)
          })
      })
  })

  step('check if balance of address 1 is correct (no fee charged)', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 10000000000, `Expected balance of address '${context.address1}' to be '10000000000'`)
          })
      })
  })
})
