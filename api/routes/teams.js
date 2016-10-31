'use strict'

exports.register = function (server, options, next) {
  const mu = options.mu

  function handleRoleCommandType (role, cmd, type, params, request, reply) {
    mu.dispatch({ role, cmd, type, params }, function (err, res) {
      if (err) {
        return reply(err)
      }

      return reply(res)
    })
  }

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
          return reply(err)
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
          return reply(err)
        }

        return reply().code(204)
      })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
