'use strict'

const Server = require('./index')
Server.start((err) => {
  if (err) {
    return console.error(`Failed to start server: ${err.message}`)
  }

  console.log('Server started on: ' + Server.info.uri.toLowerCase())
})
