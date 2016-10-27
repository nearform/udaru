'use strict'

var Hapi = require('hapi')
var mu = require('mu')()
var tcp = require('mu/drivers/tcp')

var server = new Hapi.Server()

const SERVICE_PORT = process.env.SERVICE_PORT || 8000
const SERVICE_HOST = process.env.SERVICE_HOST || 'localhost'

server.connection({
  port: Number(SERVICE_PORT),
  host: SERVICE_HOST,
  routes: { cors: true } // TODO: find a better solution
})

mu.outbound({role: 'authorization'}, tcp.client({port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost'}))

server.register([{
  register: require('good'),
  options: {
    opsInterval: 1000,
    reporters: [{ reporter: require('good-console'), events: { log: '*', response: '*' } }]
  }
}, {
  register: require('./routes/users'),
  options: { mu }
}, {
  register: require('./routes/policies'),
  options: { mu }
}, {
  register: require('./routes/teams'),
  options: { mu }
}, {
  register: require('./routes/authorization'),
  options: { mu }
}], function (err) {
  if (err) { throw err }
  server.start(function () {
    console.log('hapi server listening on port: ' + SERVICE_PORT)
  })
})
