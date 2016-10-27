'use strict'

var mu = require('mu')()
var tcp = require('mu/drivers/tcp')
var Boom = require('boom')

mu.outbound({role: 'authorization'}, tcp.client({port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost'}))

function handleRoleCommandType (role, cmd, type, params, request, reply) {
  mu.dispatch({
    role,
    cmd,
    type,
    params
  }, function (err, res) {
    if (err) {
      if (err === 'not found') return reply(Boom.notFound())
      return reply(Boom.badImplementation())
    }

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
      const params = null

      handleRoleCommandType('authorization', 'list', 'users', params, request, reply)
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

      handleRoleCommandType('authorization', 'read', 'user', params, request, reply)
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
          return reply(Boom.badImplementation())
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
          if (err === 'not found') return reply(Boom.notFound())
          return reply(Boom.badImplementation())
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

      handleRoleCommandType('authorization', 'update', 'user', params, request, reply)
    }
  })

   // curl http://localhost:8000/authorization/policies
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      const params = null

      handleRoleCommandType('authorization', 'list', 'policies', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/policy/123
  server.route({
    method: 'GET',
    path: '/authorization/policy/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      handleRoleCommandType('authorization', 'read', 'policy', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/teams
  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const params = null

      handleRoleCommandType('authorization', 'list', 'teams', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/team
  server.route({
    method: 'POST',
    path: '/authorization/team',
    handler: function (request, reply) {
      const { name, description } = request.payload

      const params = [
        name,
        description,
        null, // TODO: team_parent_id, null coz sub-teams aren't yet implemented
        'WONKA'
      ]

      mu.dispatch({ role: 'authorization', cmd: 'create', type: 'team', params }, function (err, res) {
        if (err) {
          return reply(Boom.badImplementation())
        }

        return reply(res).code(201)
      })
    }
  })

  // curl http://localhost:8000/authorization/team/123
  server.route({
    method: 'GET',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      handleRoleCommandType('authorization', 'read', 'team', params, request, reply)
    }
  })

  // curl -X PUT http://localhost:8000/authorization/team/123 -H 'Content-Type: application/json' -d '{ "id": 9, "name": "Sys Admins", "description": "System administrator team",
  // "users": [{ "id": 4, "name": "Tom Watson"}, { "id": 7, "name": "Michael O'Brien"}], "policies": [{ "id": 12, "name": "Financial info access"}]}'
  server.route({
    method: 'PUT',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const id = request.params.id

      const { name, description, users, policies } = request.payload

      const params = [
        id,
        name,
        description,
        users,
        policies
      ]

      handleRoleCommandType('authorization', 'update', 'team', params, request, reply)
    }
  })

  // curl -X DELETE http://localhost:8000/authorization/team/123
  server.route({
    method: 'DELETE',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      mu.dispatch({ role: 'authorization', cmd: 'delete', type: 'teams', params }, function (err, res) {
        if (err) {
          if (err === 'not found') return reply(Boom.notFound())
          return reply(Boom.badImplementation())
        }

        return reply().code(204)
      })
    }
  })

  // curl -X GET http://localhost:8000/authorization/check/<resource>/<action>/<user_id>
  server.route({
    method: 'GET',
    path: '/authorization/check/{resource}/{action}/{userId}',
    handler: function (request, reply) {
      const { resource, action, userId } = request.params // TODO: get userId from token

      const params = {
        userId,
        action,
        resource
      }

      handleRoleCommandType('authorization', 'authorize', 'user', params, request, reply)
    }
  })

}
