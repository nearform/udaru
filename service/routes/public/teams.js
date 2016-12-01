'use strict'

const Boom = require('boom')
const TeamOps = require('./../../lib/teamOps')

exports.register = function (server, options, next) {
  const teamOps = TeamOps(options.dbPool, server.logger())

  // curl http://localhost:8080/authorization/teams
  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      teamOps.listAllTeams([], reply)
    }
  })

  // curl http://localhost:8080/authorization/team
  server.route({
    method: 'POST',
    path: '/authorization/team',
    handler: function (request, reply) {
      if (!request.payload.name || !request.payload.description) return reply(Boom.badRequest())

      const { name, description } = request.payload

      const params = [
        name,
        description,
        null, // TODO: team_parent_id, null coz sub-teams aren't yet implemented
        'WONKA'
      ]

      teamOps.createTeam(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    }
  })

  // curl http://localhost:8080/authorization/team/123
  server.route({
    method: 'GET',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      teamOps.readTeamById(params, reply)
    }
  })

  // curl -X PUT http://localhost:8080/authorization/team/123 -H 'Content-Type: application/json' -d '{ "id": 9, "name": "Sys Admins", "description": "System administrator team",
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

      teamOps.updateTeam(params, reply)
    }
  })

  // curl -X DELETE http://localhost:8080/authorization/team/123
  server.route({
    method: 'DELETE',
    path: '/authorization/team/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      teamOps.deleteTeamById(params, function (err, res) {
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
