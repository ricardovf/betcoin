const HttpServer = require('./../lib/httpServer')
const Blockchain = require('./../lib/blockchain')
const Operator = require('./../lib/operator')
const Miner = require('./../lib/miner')
const Node = require('./../lib/node')

const logger = require('../lib/util/cli/logger.js')

class BetcoinFactory {
  constructor () {
    this.logger = logger
    this.name = 'default'
    this.blockchain = new Blockchain(this.name, this.logger)
    this.operator = new Operator(this.name, this.blockchain, this.logger)
    this.miner = new Miner(this.blockchain, this.logger)
    this.node = null
    this.server = null
  }

  startServer (host, port) {
    // rename the database files to correspond to this server host:port
    this.rename(host + '_' + port)

    if (this.isNode()) {
      if (this.node.port !== port) {
        // change the port of the server
        this.node.port = port
        this.server.close()
        this.server.listen(host, port)
      }
    } else {
      this.node = new Node(host, port, [], this.blockchain)
      this.server = new HttpServer(this.node, this.blockchain, this.operator, this.miner)

      this.server.listen(host, port)
    }

    return this.server
  }

  stopServer () {
    if (this.isNode()) {
      this.server.close()
    }
  }

  isNode () {
    return this.node !== null
  }

  /**
   * The name is needed because we use filesystem to store the database, so if we create new node, it has to access
   * the unique file associated with it.
   *
   * @param name
   */
  rename (name) {
    if (this.name === name) { return }

    this.name = name
    this.blockchain.rename(name)
    this.operator.rename(name)
  }
}

module.exports = new BetcoinFactory()
