'use strict'

var Hapi = require('hapi')
var services = require('./services')

var server = new Hapi.Server()

const SERVICE_PORT = process.env.SERVICE_PORT || 8000
const SERVICE_HOST = process.env.SERVICE_HOST || 'localhost'

server.connection({
  port: Number(SERVICE_PORT),
  host: SERVICE_HOST,
  routes: { cors: true } // TODO: find a better solution
})

services(server)
server.register({
  register: require('good'),
  options: {
    opsInterval: 1000,
    reporters: [{ reporter: require('good-console'), events: { log: '*', response: '*' } }]
  }
}, function (err) {
  if (err) { throw err }
  server.start(function () {
    console.log('hapi server listening on port: ' + SERVICE_PORT)
  })
})
