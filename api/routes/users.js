'use strict'

var Boom = require('boom')

exports.register = function (server, options, next) {
  const mu = options.mu

  // curl http://localhost:8000/authorization/users
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      const params = null

      options.handleRoleCommandType('authorization', 'list', 'users', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/user/123
  server.route({
    method: 'GET',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      options.handleRoleCommandType('authorization', 'read', 'user', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/user -X POST -H 'Content-Type: application/json' -d '{"name":"Violet Beauregarde"}'
  server.route({
    method: 'POST',
    path: '/authorization/user',
    handler: function (request, reply) {
      if (!request.payload.name) return reply(Boom.badRequest())

      const params = [
        request.payload.name,
        'WONKA' // TODO: hardcode the org_id for now (as not yet fully implemented)
      ]

      mu.dispatch({ role: 'authorization', cmd: 'create', type: 'user', params }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    }
  })

  // curl -X DELETE http://localhost:8000/authorization/user/123
  server.route({
    method: 'DELETE',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      const id = request.params.id

      const params = [
        id
      ]

      mu.dispatch({ role: 'authorization', cmd: 'delete', type: 'user', params }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    }
  })

  // curl -X PUT http://localhost:8000/authorization/user/1 -H "Content-Type: application/json" -d '{"id": 1, "name": "Mrs Beauregarde",
  // "teams":[{"id": 3, "name": "Dream Team"}], "policies":[{"id": 4, "name": "DROP ALL TABLES!"}, { "id": 2, "name": "THROW DESK" }]}'
  server.route({
    method: 'PUT',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      const id = request.params.id
      const { policies, teams, name } = request.payload

      const params = [
        id,
        name,
        teams,
        policies
      ]

      options.handleRoleCommandType('authorization', 'update', 'user', params, request, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
