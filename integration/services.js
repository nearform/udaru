'use strict'

var mu = require('mu')()
var tcp = require('mu/drivers/tcp')

mu.outbound({role: 'authorization'}, tcp.client({port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost'}))

function handleRoleCommandType (role, command, type, params, request, reply) {
  mu.dispatch({role: role, cmd: command, type: type, params: params}, function (err, res) {
    if (err) return reply(err).code(500)
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
      if (request.payload.name) {
        console.log('Received POST, name= ' + request.payload.name)
        // hardcode the org_id for now (as not yet fully implemented)
        handleRoleCommandType('authorization', 'create', 'user', [request.payload.name, 'WONKA'], request, reply)
      }
    }
  })

  // curl -X DELETE http://localhost:8000/authorization/user/123
  server.route({
    method: 'DELETE',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      // console.log("rawPayload: " + request.rawPayload)
      if (request.params.id) {
        console.log('Received DELETE, id=' + request.params.id)
        handleRoleCommandType('authorization', 'delete', 'user', [request.params.id], request, reply)
      }
    }
  })

  // curl -X PUT http://localhost:8000/authorization/user/123 -H 'Content-Type: application/json' -d '{"name": "Mrs Beauregarde"}'
  server.route({
    method: 'PUT',
    path: '/authorization/user/{id}',
    handler: function (request, reply) {
      
      const { policies, teams, id, name } = request.payload

      const params = [
        id,
        name,
        teams,
        policies
      ]
      
      if (request.params.id && request.payload.name) {
        console.log('Received PUT, name= ' + request.payload.name + ', id=' + request.params.id)
        handleRoleCommandType('authorization', 'update', 'user', params, request, reply)
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

  // curl http://localhost:8000/authorization/team
  server.route({
    method: 'POST',
    path: '/authorization/team',
    handler: function (request, reply) {
      const { name, description } = request.payload
      const params = [
        name,
        description,
        null, // team_parent_id
        'WONKA'
      ]

      handleRoleCommandType('authorization', 'create', 'team', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/team/123
  server.route({
    method: 'GET',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      handleRoleCommandType('authorization', 'read', 'team', [request.params.id], request, reply)
    }
  })

  // curl -X PUT http://localhost:8000/authorization/team/123 -H 'Content-Type: application/json' -d '{"name": "Team A", "description": "Some description"}'
  // TODO: allow for updating more than just 'name' and 'description'
  server.route({
    method: 'PUT',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const id = request.params.id

      if (!id) {
        return reply('no team id found in request').code(400)
      }

      const { name, description } = request.payload

      const params = [
        id,
        name,
        description,
      ]

      handleRoleCommandType('authorization', 'update', 'team', params, request, reply)
    }
  })

  // curl -X DELETE http://localhost:8000/authorization/team/123
  server.route({
    method: 'DELETE',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const id = request.params.id

      handleRoleCommandType('authorization', 'delete', 'team', [id], request, reply)
    }
  })

}
