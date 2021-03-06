require('mocha-steps')
const supertest = require('supertest')
const assert = require('assert')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator = require('../lib/operator')
const EventsManager = require('../lib/betcoin/eventsManager')
const BetsManager = require('../lib/betcoin/betsManager')
const ResultsManager = require('../lib/betcoin/resultsManager')
const Miner = require('../lib/miner')
const Node = require('../lib/node')
const fs = require('fs-extra')
const logger = require('../lib/util/cli/logger.js')

describe('Basic transactions integration Test:', () => {
  const SERVER_1_PORT = 3011
  const SERVER_2_PORT = 3012
  const name1 = 'basicTransactionsIntegrationTest1'
  const name2 = 'basicTransactionsIntegrationTest2'

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
    return httpServer.listen(host, port)
  }

  const walletPassword = 't t t t t'
  let context = {}

  after('stop servers', () => {
    context.httpServer1 && context.httpServer1.close()
    context.httpServer2 && context.httpServer2.close()
  })

  step('start server', () => {
    return createBetcoin(name1, 'localhost', SERVER_1_PORT, [])
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

  step('create address 3 (for fee test)', () => {
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

  step('check confirmations for the created transaction', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/node/transactions/${context.transactionId}/confirmations`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.confirmations, 1, `Expected confirmations of transaction '${context.transactionId}' to be '1'`)
          })
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

  step('check unspent transaction from address 1', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get('/blockchain/transactions/unspent')
          .query({address: context.address1})
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.length, 3, `Expected unspent transactions of address '${context.address1}' to be '3'`)
          })
      })
  })

  step('start server 2', () => {
    return createBetcoin(name2, 'localhost', SERVER_2_PORT, [{url: 'http://localhost:'+SERVER_1_PORT}])
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

  step('check confirmations from server 1 for the created transaction', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/node/transactions/${context.transactionId}/confirmations`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.confirmations, 2, `Expected confirmations of transaction '${context.transactionId}' to be '2'`)
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

  step('mine a block with transactions', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address1})
          .expect(201)
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

  step('check address 2 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address2}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 2000000000, `Expected balance of address '${context.address2}' to be '2000000000'`)
          })
      })
  })

  /**
   * Test fee payment
   */
  step('create a new transaction to check fee', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post(`/operator/wallets/${context.walletId}/transactions`)
          .set({password: walletPassword})
          .send({
            fromAddress: context.address2,
            toAddress: context.address3,
            amount: 100000000,
            changeAddress: context.address2
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

  step('mine a block with transactions', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .post('/miner/mine')
          .send({rewardAddress: context.address1})
          .expect(201)
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

  step('check address 3 balance', () => {
    return Promise.resolve()
      .then(() => {
        return supertest(context.httpServer1.app)
          .get(`/operator/wallets/${context.walletId}/addresses/${context.address3}/balance`)
          .expect(200)
          .expect((res) => {
            assert.equal(res.body.balance, 100000000, `Expected balance of address '${context.address3}' to be '1000000000'`)
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
            assert.equal(res.body.balance, 1899999999, `Expected balance of address '${context.address2}' to be '1899999999'`)
          })
      })
  })
})
