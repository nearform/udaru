'use strict'

const Boom = require('boom')
const UserOps = require('./../../lib/userOps')

exports.register = function (server, options, next) {
  const userOps = UserOps(options.dbPool, server.logger())

  // curl http://localhost:8080/authorization/users
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      userOps.listAllUsers([], reply)
    }
  })

  // curl http://localhost:8080/authorization/users/123
  server.route({
    method: 'GET',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      userOps.readUserById(params, reply)
    }
  })

  // curl http://localhost:8080/authorization/users -X POST -H 'Content-Type: application/json' -d '{"name":"Violet Beauregarde"}'
  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      if (!request.payload.name) return reply(Boom.badRequest())

      const params = [
        request.payload.name,
        'WONKA' // TODO: hardcode the org_id for now (as not yet fully implemented)
      ]

      userOps.createUser(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    }
  })

  // curl -X DELETE http://localhost:8080/authorization/users/123
  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      userOps.deleteUserById(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    }
  })

  // curl -X PUT http://localhost:8080/authorization/users/1 -H "Content-Type: application/json" -d '{"id": 1, "name": "Mrs Beauregarde",
  // "teams":[{"id": 3, "name": "Dream Team"}], "policies":[{"id": 4, "name": "DROP ALL TABLES!"}, { "id": 2, "name": "THROW DESK" }]}'
  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const id = request.params.id
      const { policies, teams, name } = request.payload
      const params = [
        id,
        name,
        teams,
        policies
      ]

      userOps.updateUser(params, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
