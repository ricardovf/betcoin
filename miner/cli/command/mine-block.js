const betcoin = require('../../../lib/betcoin/index')
const Block = require('../../../lib/blockchain/block')

module.exports = function (vorpal) {
  vorpal
    .command('mine <rewardAddress>', 'Try to mine a new block and put the reward to the address.')
    .alias('m')
    .action(function (args, callback) {
      if (args.rewardAddress) {
        betcoin.miner.mine(args.rewardAddress)
          .then((newBlock) => {
            newBlock = Block.fromJson(newBlock)
            betcoin.blockchain.addBlock(newBlock)

            vorpal.exec('b l').then(() => {
              vorpal.exec(`t ${newBlock.hash}`)
            })
          })
          .catch((ex) => {
            // @todo deal with it
            // if (ex instanceof BlockAssertionError && ex.message.includes('Invalid index'))
            //  next(new HTTPError(409, 'A new block were added before we were able to mine one'), null, ex)
            // else next(ex)
          })
      }

      callback()
    })
}
