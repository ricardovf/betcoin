require('mocha-steps')
const supertest = require('supertest')
const assert = require('assert')
const should = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator = require('../lib/operator')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const fs = require('fs-extra')
const EventsManager = require('../lib/betcoin/eventsManager')
const BetsManager = require('../lib/betcoin/betsManager')

const logger = require('../lib/util/cli/logger.js')

describe('Bets integration Test:', () => {
  const name1 = 'betsIntegrationTest1'
  const name2 = 'betsIntegrationTest2'

  let createBetcoin = (name, host, port, peers) => {
    fs.removeSync('data/' + name + '/')
    let blockchain = new Blockchain(name, logger)
    let operator = new Operator(name, blockchain, logger)
    let miner = new Miner(blockchain, logger)
    let node = new Node(host, port, peers, blockchain, logger)
    let eventsManager = new EventsManager(blockchain, operator, logger)
    let betsManager = new BetsManager(blockchain, operator, logger)
    let httpServer = new HttpServer(node, blockchain, operator, miner, logger)

    return {
      httpServer,
      eventsManager,
      betsManager,
    }
  }

  const walletPassword = 't t t t t'
  let context = {}

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

  step('create address 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/addresses`)
          .set({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.address2 = res.body.address
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

  step('create a transaction', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/transactions`)
          .set({password: walletPassword})
          .send({
            fromAddress: context.address1,
            toAddress: context.address2,
            amount: 1000000000,
            changeAddress: context.address1
          })
          .expect(201)
      })
      .then((res) => {
        context.transactionId = res.body.id
      })
  })

  step('mine a block with transactions', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address1})
          .expect(201)
      })
  })

  step('check address 1 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 9000000000, `Expected balance of address '${context.address1}' to be '9000000000'`)
          })
      })
  })

  step('check address 2 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address2}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 1000000000, `Expected balance of address '${context.address2}' to be '1000000000'`)
          })
      })
  })

  step('start server 2', () => {
    let betcoin = createBetcoin(name2, 'localhost', 3002, [{url: 'http://localhost:3001'}])
    context.eventsManager2 = betcoin.eventsManager
    context.betsManager2 = betcoin.betsManager

    return betcoin.httpServer.listen('localhost', 3002)
      .then((httpServer) => {
        context.httpServer2 = httpServer
      })
  })

  step('wait for nodes synchronization', () => {
    return Promise.resolve()
      .then(() => {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve()
          }, 1000) // Wait 1s then resolve.
        })
      })
  })

  step('check blockchain size in server 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer2.app)
          .get('/blockchain/blocks')
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 3, 'Expected blockchain size of 3 on server 2')
          })
      })
  })

  step('check confirmations from server 2 for the created transaction', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer2.app)
          .get(`/node/transactions/${context.transactionId}/confirmations`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.confirmations, 2, `Expected confirmations of transaction '${context.transactionId}' to be '2'`)
          })
      })
  })

  step('create a new transaction', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/transactions`)
          .set({password: walletPassword})
          .send({
            fromAddress: context.address1,
            toAddress: context.address2,
            amount: 1000000000,
            changeAddress: context.address1
          })
          .expect(201)
      })
      .then((res) => {
        context.transactionId = res.body.id
      })
  })

  step('wait for nodes synchronization', () => {
    return Promise.resolve()
      .then(() => {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve()
          }, 1000) // Wait 1s then resolve.
        })
      })
  })

  step('check transactions', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get('/blockchain/transactions')
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 1, `Expected transactions size of '${context.transactionId}' to be '1'`)
          })
      })
      .then((res) => {
        context.transactionId = res.body.id
      })
  })

  step('create a event', () => {
    return Promise.resolve()
      .then(() => {
        context.event = context.eventsManager1.createEvent('soccer', 'winner', '20/11/2017 20:45', ['Avai', 'Figueira'])

        return supertest(context.httpServer1.app)
          .post(`/blockchain/transactions`)
          .send(context.event)
          .expect(201)
          .expect((res) => {
            should(res.body.id).be.equal(context.event.id)
          })
      })
      .then((res) => {
        context.eventId = res.body.id
      })
  })

  step('mine a block with the event', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
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
            assert.equal(res.body[0].id, context.eventId, `Expected event id to be equal ${context.eventId}`)
          })
      })
  })

  step('create a bet', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/bets`)
          .set({password: walletPassword})
          .send({
            betEvent: context.eventId,
            betType: context.event.eventType,
            betOn: 'Figueira',
            fromAddressId: context.address1,
            amount: 1234567890
          })
          .expect(201)
      })
      .then((res) => {
        context.betId = res.body.id
      })
  })

  step('mine a block with the bet', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('check if the bet was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/bets`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 1, `Expected bets array size to be '1'`)
            assert.equal(res.body[0].id, context.betId, `Expected bet id to be equal ${context.betId}`)
          })
      })
  })

  step('wait for nodes synchronization', () => {
    return Promise.resolve()
      .then(() => {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve()
          }, 1000) // Wait 1s then resolve.
        })
      })
  })

  step('check if balance of address 1 was altered', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 8000000000 - 1234567890 - 2, `Expected balance of address '${context.address1}' to be '9000000000'`)
          })
      })
  })

})
