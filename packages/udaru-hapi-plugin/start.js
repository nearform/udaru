'use strict'

const start = require('./lib/standalone/server')

// if forked as child, send output message via ipc to parent
// otherwise output to console
function logMessage (message) {
  if (!process.send) {
    console.log(message)
  } else {
    process.send(message)
  }
}

start()
  .then(server => {
    logMessage('Server started on: ' + server.info.uri.toLowerCase())
  })
  .catch(err => {
    logMessage(`Failed to start server: ${err.message}`)
  })
