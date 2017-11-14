require('mocha-steps')
const supertest = require('supertest')
const assert = require('assert')
const should = require('should')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator = require('../lib/operator')
const EventsManager = require('../lib/betcoin/eventsManager')
const BetsManager = require('../lib/betcoin/betsManager')
const ResultsManager = require('../lib/betcoin/resultsManager')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const fs = require('fs-extra')
const moment = require('moment')

const logger = require('../lib/util/cli/logger.js')

describe('Betcoin integration Test:', () => {

  const SERVER_1_PORT = 3001
  const SERVER_2_PORT = 3002
  const name1 = 'betcoinIntegrationTest1'
  const name2 = 'betcoinIntegrationTest2'

  let createBetcoin = (name, host, port, peers) => {
    fs.removeSync('data/' + name + '/')
    let blockchain = new Blockchain(name, logger)
    let operator = new Operator(name, blockchain, logger)
    let eventsManager = new EventsManager(blockchain, operator, logger)
    let betsManager = new BetsManager(blockchain, operator, logger)
    let resultsManager = new ResultsManager(blockchain, operator, betsManager, logger)
    let miner = new Miner(blockchain, resultsManager, logger)
    let node = new Node(host, port, peers, blockchain, logger)
    let httpServer = new HttpServer(node, blockchain, operator, eventsManager, betsManager, resultsManager, miner, logger)

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
    context.httpServer2 && context.httpServer2.close()
  })

  step('start server', () => {
    let betcoin = createBetcoin(name1, 'localhost', SERVER_1_PORT, [])
    context.eventsManager1 = betcoin.eventsManager
    context.betsManager1 = betcoin.betsManager

    return betcoin.httpServer.listen('localhost', SERVER_1_PORT)
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
    let betcoin = createBetcoin(name2, 'localhost', SERVER_2_PORT, [{url: 'http://localhost:' + SERVER_1_PORT}])
    context.eventsManager2 = betcoin.eventsManager
    context.betsManager2 = betcoin.betsManager

    return betcoin.httpServer.listen('localhost', SERVER_2_PORT)
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

  step('create address 3', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/addresses`)
          .set({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.address3 = res.body.address
      })
  })

  step('create address 4', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/addresses`)
          .set({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.address4 = res.body.address
      })
  })

  step('create address 5', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/addresses`)
          .set({password: walletPassword})
          .expect(201)
      }).then((res) => {
        context.address5 = res.body.address
      })
  })

  step('mine a block rewarding address 3', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address3})
          .expect(201)
      })
  })

  step('transfer 2 to address 4', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/transactions`)
          .set({password: walletPassword})
          .send({
            fromAddress: context.address3,
            toAddress: context.address4,
            amount: 2,
            changeAddress: context.address3
          })
          .expect(201)
      })
  })

  step('transfer 3 to address 5', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/transactions`)
          .set({password: walletPassword})
          .send({
            fromAddress: context.address3,
            toAddress: context.address5,
            amount: 3,
            changeAddress: context.address3
          })
          .expect(201)
      })
  })

  step('mine a block rewarding address 3 again', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address3})
          .expect(201)
      })
  })

  step('check address 3 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address3}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 14999999997, `Expected balance of address '${context.address1}' to be '14.999.999.997'`)
          })
      })
  })

  step('check address 4 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address4}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 2, `Expected balance of address '${context.address4}' to be '2'`)
          })
      })
  })

  step('check address 5 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address5}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 3, `Expected balance of address '${context.address5}' to be '3'`)
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
            date: moment().add(10, 'days').format(EventsManager.dateFormat()),
            teams: ['Avai', 'Figueira']
          })
          .expect(201)
      })
      .then((res) => {
        context.event = res.body
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
            assert.equal(res.body[0].id, context.event.id, `Expected event id to be equal ${context.event.id}`)
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
            betEvent: context.event.id,
            betType: context.event.eventType,
            betOn: 'Figueira',
            fromAddressId: context.address1,
            amount: 1234567890
          })
          .expect(201)
      })
      .then((res) => {
        context.bet = res.body
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
            assert.equal(res.body[0].id, context.bet.id, `Expected bet id to be equal ${context.bet.id}`)
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

  step('create a result', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/results`)
          .send({
            resultEvent: context.event.id,
            resultBetType: context.event.data.betType,
            result: 'Figueira'
          })
          .expect(201)
      })
      .then((res) => {
        context.result = res.body
      })
  })

  step('mine a block with the result', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('check if the result was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/results`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 1, `Expected results array size to be '1'`)
            assert.equal(res.body[0].id, context.result.id, `Expected result id to be equal ${context.result.id}`)
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
            assert.equal(res.body.balance, 8000000000 - 2, `Expected balance of address '${context.address1}' to be '7999999998'`)
          })
      })
  })

  step('create event 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/events`)
          .send({
            eventType: 'soccer',
            betType: 'winner',
            date: moment().add(10, 'days').format(EventsManager.dateFormat()),
            teams: ['São Paulo', 'Figueira']
          })
          .expect(201)
      })
      .then((res) => {
        context.event2 = res.body
      })
  })

  step('mine a block with event 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('check if event 2 was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/events`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 2, `Expected events array size to be '2'`)
            assert.equal(res.body[1].id, context.event2.id, `Expected event 2 id to be equal ${context.event2.id}`)
          })
      })
  })

  step('create bet 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/bets`)
          .set({password: walletPassword})
          .send({
            betEvent: context.event2.id,
            betType: context.event2.eventType,
            betOn: 'Figueira',
            fromAddressId: context.address3,
            amount: 100
          })
          .expect(201)
      })
      .then((res) => {
        context.bet2 = res.body
      })
  })

  step('check address 4 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address4}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 2, `Expected balance of address '${context.address4}' to be '2'`)
          })
      })
  })

  step('create bet 3', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/bets`)
          .set({password: walletPassword})
          .send({
            betEvent: context.event2.id,
            betType: context.event2.eventType,
            betOn: 'São Paulo',
            fromAddressId: context.address4,
            amount: 1
          })
          .expect(201)
      })
      .then((res) => {
        context.bet3 = res.body
      })
  })

  step('mine a block with the bets', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('create bet 4', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/bets`)
          .set({password: walletPassword})
          .send({
            betEvent: context.event2.id,
            betType: context.event2.eventType,
            betOn: 'São Paulo',
            fromAddressId: context.address5,
            amount: 2
          })
          .expect(201)
      })
      .then((res) => {
        context.bet4 = res.body
      })
  })

  step('mine a block with the bets', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('check if the bets were added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/bets`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 4, `Expected bets array size to be '4'`)
            // assert.equal(res.body[0].id, context.bet.id, `Expected bet id to be equal ${context.bet.id}`)
          })
      })
  })

  step('create result 2', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/results`)
          .send({
            resultEvent: context.event2.id,
            resultBetType: context.event2.data.betType,
            result: 'São Paulo'
          })
          .expect(201)
      })
      .then((res) => {
        context.result2 = res.body
      })
  })

  step('mine a block with the result', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address2})
          .expect(201)
      })
  })

  step('check if the result was added', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/blockchain/results`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 2, `Expected results array size to be '2'`)
            assert.equal(res.body[1].id, context.result2.id, `Expected result id to be equal ${context.result2.id}`)
          })
      })
  })

  step('check if balance of address 3 was altered', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address3}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 14999999896, `Expected balance of address '${context.address3}' to be '14999999896'`)
          })
      })
  })

  step('check if balance of address 4 was altered', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address4}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 34.333333333333336, `Expected balance of address '${context.address4}' to be '34.333333333333336'`)
          })
      })
  })

  step('check if balance of address 5 was altered', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address5}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 68.66666666666667, `Expected balance of address '${context.address5}' to be '68.66666666666667'`)
          })
      })
  })

})
