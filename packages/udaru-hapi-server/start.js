'use strict'

const Server = require('./index')
Server.start((err) => {
  if (err) {
    return logMessage(`Failed to start server: ${err.message}`)
  }
  logMessage('Server started on: ' + Server.info.uri.toLowerCase())
})

// if forked as child, send output message via ipc to parent
// otherwise output to console
function logMessage (message) {
  if (!process.send) {
    console.log(message)
  } else {
    process.send(message)
  }
}
