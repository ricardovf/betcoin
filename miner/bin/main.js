#!/usr/bin/env node
const betcoin = require('../betcoin')
const vorpal = require('vorpal')()
vorpal.use(require('./../cli'))

function exitHandler(options, err) {
  // Tries to stop the server on exit, so the port is set free
  betcoin.stopServer();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));