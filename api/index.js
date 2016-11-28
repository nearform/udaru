'use strict'

var Hapi = require('hapi')
var mu = require('mu')()
var tcp = require('mu/drivers/tcp')
var config = require('./lib/config')
var buildHandleRoleCommandType = require('./lib/buildHandleRoleCommandType')

var server = new Hapi.Server()

server.connection({
  port: Number(config.get('server.port')),
  host: config.get('server.host'),
  routes: {
    cors: true
  }
})

mu.outbound({role: 'authorization'}, tcp.client(config.get('mu')))

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
    console.log('hapi server listening on port: ' + config.get('server.port'))
  })
})

module.exports = server
