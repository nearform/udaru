'use strict'

const Server = require('./index')
Server.start(() => {
  console.log('Server started on: ' + Server.info.uri.toLowerCase())
})
