'use strict'

var mu = require('mu')()
var tcp = require('mu/drivers/tcp')

mu.outbound({role: 'auth'}, tcp.client({port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost'}))

function handleRoleCommandType (role, command, type, request, reply) {
  mu.dispatch({role: role, cmd: command, type: type}, function (err, res) {
    reply({result: err ? 'error' : res, err: err})
  })
}

function handleRoleCommand (role, command, request, reply) {
  mu.dispatch({role: role, cmd: command}, function (err, res) {
    reply({result: err ? 'error' : res, err: err})
  })
}

module.exports = function (server) {
  server.route({
    method: 'GET',
    path: '/auth/users',
    handler: function (request, reply) { handleRoleCommandType('auth', 'list', 'users', request, reply) }
  })
}
