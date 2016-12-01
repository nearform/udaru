'use strict'

var config = require('./lib/config')
var initServer = require('./initServer')

initServer(function (server) {
  server.start(function () {
    console.log('hapi server listening on port: ' + config.get('server.port'))
  })
})
