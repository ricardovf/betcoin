#!/usr/bin/env node
const betcoin = require('../betcoin')
const vorpal = require('vorpal')()
vorpal.use(require('./../cli'))

require('../../lib/util/exit')((options, err) => {
  // Tries to stop the server on exit, so the port is set free
  betcoin.stopServer();
})