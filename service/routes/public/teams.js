'use strict'

const Joi = require('joi')
const TeamOps = require('./../../lib/teamOps')

exports.register = function (server, options, next) {
  const teamOps = TeamOps(options.dbPool, server.logger())

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      teamOps.listAllTeams([], reply)
    },
    config: {
      description: 'Fetch all teams',
      notes: 'The GET /authorization/teams endpoint returns a list of all teams\n',
      tags: [ 'api', 'service', 'get', 'team' ]
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
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
    },
    config: {
      validate: {
        payload: {
          name: Joi.string().required().description('Name of the new team'),
          description: Joi.string().required().description('Description of new team')
        }
      },
      description: 'Create a teams',
      notes: 'The POST /authorization/teams endpoint creates a new team given its data\n',
      tags: [ 'api', 'service', 'post', 'team' ]
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      teamOps.readTeamById(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        }
      },
      description: 'Fetch a team given its identifier',
      notes: 'The GET /authorization/teams/{id} endpoint returns a single team data\n',
      tags: [ 'api', 'service', 'get', 'team' ]
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}',
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
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        },
        payload: {
          name: Joi.string().required().description('Updated team name'),
          description: Joi.string().required().description('Updated team description'),
          users: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          })),
          policies: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      },
      description: 'Update a team',
      notes: 'The PUT /authorization/teams endpoint updates a team data\n',
      tags: [ 'api', 'service', 'put', 'team' ]
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}',
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
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        }
      },
      description: 'Delete a team',
      notes: 'The DELETE /authorization/teams endpoint deletes a team\n',
      tags: [ 'api', 'service', 'delete', 'team' ]
    }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
