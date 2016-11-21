'use strict'

var Hapi = require('hapi')
var mu = require('mu')()
var tcp = require('mu/drivers/tcp')
var buildHandleRoleCommandType = require('./../lib/buildHandleRoleCommandType')

var server = new Hapi.Server()

const API_PORT = process.env.API_PORT || 8000
const API_HOST = process.env.API_HOST || 'localhost'

server.connection({
  port: Number(API_PORT),
  host: API_HOST,
  routes: {
    cors: true
  }
})

mu.outbound({role: 'authorization'}, tcp.client({
  host: process.env.SERVICE_HOST || 'localhost',
  port: process.env.SERVICE_PORT || 8080
}))

var options = {
  mu,
  handleRoleCommandType: buildHandleRoleCommandType(mu)
}

server.register([{
  register: require('good'),
  options: {
    opsInterval: 1000,
    reporters: [{ reporter: require('good-console'), events: { log: '*', response: '*' } }]
  }
}, {
  register: require('./routes/users'),
  options
}, {
  register: require('./routes/policies'),
  options
}, {
  register: require('./routes/teams'),
  options
}, {
  register: require('./routes/authorization'),
  options
}], function (err) {
  if (err) { throw err }
  server.start(function () {
    console.log('hapi server listening on port: ' + API_PORT)
  })
})

module.exports = server
