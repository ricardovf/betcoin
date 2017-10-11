let logger

if (process.env.NODE_ENV === 'test') {
  logger = {
    debug  : function (message) { },
    log    : function (message) { },
    info   : function (message) { },
    confirm: function (message) { },
    warn   : function (message) { },
    error  : function (message) { },
    fatal  : function (message) { }
  }
} else {
  let vorpal = require('vorpal')()

  logger = {
    debug  : function (message) { vorpal.log(message) },
    log    : function (message) { vorpal.log(message) },
    info   : function (message) { vorpal.log(message) },
    confirm: function (message) { vorpal.log(message) },
    warn   : function (message) { vorpal.log(message) },
    error  : function (message) { vorpal.log(message) },
    fatal  : function (message) { vorpal.log(message) }
  }
}

module.exports = logger
