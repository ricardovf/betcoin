require('mocha-steps')
const supertest  = require('supertest')
const assert     = require('assert')
const HttpServer = require('../lib/httpServer')
const Blockchain = require('../lib/blockchain')
const Operator   = require('../lib/operator')
const Miner      = require('../lib/miner')
const Node       = require('../lib/node')
const fs         = require('fs-extra')

const logger = require('../lib/util/cli/logger.js')

//describe('Events integration Test:', () => {
//  const name1 = 'eventsIntegrationTest1'
//  const name2 = 'eventsIntegrationTest2'
//
//  let createBetcoin = (name, host, port, peers) => {
//    fs.removeSync('data/' + name + '/')
//    let blockchain = new Blockchain(name, logger)
//    let operator   = new Operator(name, blockchain, logger)
//    let miner      = new Miner(blockchain, logger)
//    let node       = new Node(host, port, peers, blockchain, logger)
//    let httpServer = new HttpServer(node, blockchain, operator, miner, logger)
//    return httpServer.listen(host, port)
//  }
//
//  const walletPassword = 't t t t t'
//  let context          = {}
//
//  step('start server', () => {
//    return createBetcoin(name1, 'localhost', 3001, [])
//      .then((httpServer) => {
//        context.httpServer1 = httpServer
//      })
//  })
//
//  step('create wallet', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post('/operator/wallets')
//          .send({password: walletPassword})
//          .expect(201)
//      }).then((res) => {
//        context.walletId = res.body.id
//      })
//  })
//
//  step('create address 1', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post(`/operator/wallets/${context.walletId}/addresses`)
//          .set({password: walletPassword})
//          .expect(201)
//      }).then((res) => {
//        context.address1 = res.body.address
//      })
//  })
//
//  step('create address 2', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post(`/operator/wallets/${context.walletId}/addresses`)
//          .set({password: walletPassword})
//          .expect(201)
//      }).then((res) => {
//        context.address2 = res.body.address
//      })
//  })
//
//  step('mine an empty block', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post('/miner/mine')
//          .send({rewardAddress: context.address1})
//          .expect(201)
//      })
//  })
//
//  step('check address 1 first balance', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .get(`/operator/wallets/${context.walletId}/addresses/${context.address1}/balance`)
//          .expect(200)
//          .expect((res) => {
//            assert.equal(res.body.balance, 5000000000, `Expected balance of address '${context.address1}' to be '5000000000'`)
//          })
//      })
//  })
//
//  step('add an event transaction', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post(`/operator/wallets/${context.walletId}/transactions`)
//          .set({password: walletPassword})
//          .send({
//            fromAddress  : context.address1,
//            toAddress    : context.address2,
//            amount       : 1000000000,
//            changeAddress: context.address1
//          })
//          .expect(201)
//      })
//      .then((res) => {
//        context.transactionId = res.body.id
//      })
//  })
//
//  step('mine a block with transactions', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .post('/miner/mine')
//          .send({rewardAddress: context.address1})
//          .expect(201)
//      })
//  })
//
//  step('check confirmations for the created transaction', () => {
//    return Promise.resolve()
//      .then(() => {
//        return supertest(context.httpServer1.app)
//          .get(`/node/transactions/${context.transactionId}/confirmations`)
//          .expect(200)
//          .expect((res) => {
//            assert.equal(res.body.confirmations, 1, `Expected confirmations of event transaction '${context.transactionId}' to be '1'`)
//          })
//      })
//  })
//})
