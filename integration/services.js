'use strict'

var mu = require('mu')()
var tcp = require('mu/drivers/tcp')

mu.outbound({role: 'authorization'}, tcp.client({port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost'}))

function handleRoleCommandType (role, command, type, params, request, reply) {
  mu.dispatch({role: role, cmd: command, type: type, params: params}, function (err, res) {
    // TODO: consider using Boom
    if (err) return reply('Internal Server Error').code(500)
    return reply(res)
  })
}

// TODO: add input validation
module.exports = function (server) {
  // curl http://localhost:8000/authorization/users
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      handleRoleCommandType('authorization', 'list', 'users', null, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/user/123
  server.route({
    method: 'GET',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      mu.dispatch({role: 'authorization', cmd: 'read', type: 'user', params: [request.params.id]}, function (err, res) {
        // console.log(err, res)
        if (err && err === 'not found') return reply(err).code(410)
        if (err) return reply(err).code(500)
        return reply(res)
      })
    }
  })

  // curl http://localhost:8000/authorization/user -X POST -H 'Content-Type: application/json' -d '{"name":"Violet Beauregarde"}'
  server.route({
    method: 'POST',
    path: '/authorization/user',
    handler: function (request, reply) {
      // console.log("rawPayload: " + request.rawPayload)
      if (!request.payload.name) return reply('request payload is missing data').code(400)
      console.log('Received POST, name= ' + request.payload.name)
      // hardcode the org_id for now (as not yet fully implemented)
      mu.dispatch({role: 'authorization', cmd: 'create', type: 'user', params: [request.payload.name, 'WONKA']}, function (err, res) {
        // console.log(err, res)
        if (err) return reply(err).code(500)
        return reply(res).code(201)
      })
    }
  })

  // curl -X DELETE http://localhost:8000/authorization/user/123
  server.route({
    method: 'DELETE',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      // console.log("rawPayload: " + request.rawPayload)
      if (!request.params.id) return reply('request payload is missing data').code(400)
      console.log('Received DELETE, id=' + request.params.id)
      mu.dispatch({role: 'authorization', cmd: 'delete', type: 'user', params: [request.params.id]}, function (err, res) {
        // console.log(err, res)
        if (err && err === 'not found') return reply(err).code(410)
        if (err) return reply(err).code(500)
        return reply(res).code(204)
      })
    }
  })

  // curl -X PUT http://localhost:8000/authorization/user/123 -H 'Content-Type: application/json' -d '{"name": "Mrs Beauregarde"}'
  server.route({
    method: 'PUT',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      // console.log("rawPayload: " + request.rawPayload)
      //
      // TODO: allow for updating more than just 'name'
      //
      if (request.params.id && request.payload.name) {
        console.log('Received PUT, name= ' + request.payload.name + ', id=' + request.params.id)
        handleRoleCommandType('authorization', 'update', 'user', [request.params.id, request.payload.name], request, reply)
      }
    }
  })
   // curl http://localhost:8000/authorization/policies
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      handleRoleCommandType('authorization', 'list', 'policies', null, request, reply)
    }
  })
  // curl http://localhost:8000/authorization/policy/123
  server.route({
    method: 'GET',
    path: '/authorization/policy/{id}',
    handler: function (request, reply) {
      handleRoleCommandType('authorization', 'read', 'policy', [request.params.id], request, reply)
    }
  })
  // curl http://localhost:8000/authorization/teams
  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      handleRoleCommandType('authorization', 'list', 'teams', null, request, reply)
    }
  })
}
