// exitHandler(options, err) must only run sync calls
module.exports = (additionalHandler) => {
  let exitHandler = (options, err) => {
    if (options.exception) {
      console.log('Got an uncaught exception...')
      console.error(err)
    } else if (options.rejection) {
      console.log('Got an unhandled rejection...')
      console.error(err)
    } else {
      if (additionalHandler) {
        console.log('Making the cleanup before exit')
        additionalHandler()
      }
      console.log('Exiting...')
    }
  }

  process.on('exit', exitHandler.bind(null, {cleanup: true}))

  //catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, {exit: true}))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, {exit: true}))
  process.on('SIGUSR2', exitHandler.bind(null, {exit: true}))

  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {exception: true}))

  //catches unhandled rejection
  process.on('unhandledRejection', exitHandler.bind(null, {exit: true, rejection: true}))
}