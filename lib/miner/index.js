const R = require('ramda')
const spawn = require('threads').spawn
const Block = require('../blockchain/block')
const CryptoUtil = require('../util/cryptoUtil')
const Transaction = require('../blockchain/transaction')

const TRANSACTIONS_TO_PROCESS = 2
const FEE_PER_TRANSACTION = 1
const MINING_REWARD = 5000000000

class Miner {
  constructor (blockchain, resultsManager, logger) {
    this.blockchain = blockchain
    this.resultsManager = resultsManager
    this.logger = logger || console
  }

  mine (address) {
    let baseBlock = Miner.generateNextBlock(address, this.blockchain.getLastBlock(), this.blockchain.transactions)
    process.execArgv = R.reject((item) => item.includes('debug'), process.execArgv)

    /* istanbul ignore next */
    const thread = spawn(function (input, done) {
      /*eslint-disable */
      require(input.__dirname + '/../util/consoleWrapper.js')('mine-worker', input.logLevel)
      const Block = require(input.__dirname + '/../blockchain/block')
      const Miner = require(input.__dirname)
      /*eslint-enable */

      done(Miner.proveWorkFor(Block.fromJson(input.jsonBlock), input.difficulty, this.logger))
    })

    this.logger.info('Mining a new block')
    return thread
      .send({
        __dirname: __dirname,
        logLevel: this.logLevel,
        jsonBlock: baseBlock,
        difficulty: this.blockchain.getDifficulty()
      })
      .promise()
  }

  static generateNextBlock (address, previousBlock, blockchainTransactions) {
    const index = previousBlock.index + 1
    const previousHash = previousBlock.hash
    const timestamp = new Date().getTime() / 1000

    // Get the first two available transactions, if there aren't 2, it's empty
    let transactions = R.defaultTo([], R.take(2, blockchainTransactions))
    let regularTransactions = R.filter(R.propEq('type', 'regular'))(transactions)
    // Add fee transaction (1 satoshi per transaction), if the type is regular
    // INFO: Usually it's a fee over transaction size (not amount)
    if (regularTransactions.length > 0) {
      let feeTransaction = Transaction.fromJson({
        id: CryptoUtil.randomId(64),
        hash: null,
        type: 'fee',
        data: {
          inputs: [],
          outputs: [
            {
              amount: FEE_PER_TRANSACTION * regularTransactions.length, // satoshis format
              address: address, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address
            }
          ]
        }
      })

      transactions.push(feeTransaction)
    }

    // Distribuir
    let resultTransactions = R.filter(R.propEq('type', 'result'))(transactions)
    R.forEach((result) => {
      transactions.push(this.resultsManager.calculateGains(result))
    }, resultTransactions)


    // Add reward transaction of 50 coins
    if (address != null) {
      let rewardTransaction = Transaction.fromJson({
        id: CryptoUtil.randomId(64),
        hash: null,
        type: 'reward',
        data: {
          inputs: [],
          outputs: [
            {
              amount: MINING_REWARD, // satoshis format
              address: address, // INFO: Usually here is a locking script (to check who and when this transaction output can be used), in this case it's a simple destination address
            }
          ]
        }
      })

      transactions.push(rewardTransaction)
    }

    return Block.fromJson({
      index,
      nonce: 0,
      previousHash,
      timestamp,
      transactions
    })
  }

  static proveWorkFor (jsonBlock, difficulty, logger) {
    let blockDifficulty = null
    let start = process.hrtime()
    let block = Block.fromJson(jsonBlock)

    // Loop incrementing the nonce to find the hash at desired difficulty
    do {
      block.timestamp = new Date().getTime() / 1000
      block.nonce++
      block.hash = block.toHash()
      blockDifficulty = block.getDifficulty()
    } while (blockDifficulty >= difficulty)
    if (logger) logger.info(`Block found: time '${process.hrtime(start)[0]} sec' dif '${difficulty}' hash '${block.hash}' nonce '${block.nonce}'`)
    return block
  }
}

module.exports = Miner