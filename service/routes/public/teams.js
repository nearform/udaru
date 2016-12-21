'use strict'

const Joi = require('joi')
const TeamOps = require('./../../lib/teamOps')
const Action = require('./../../lib/config.auth').Action

exports.register = function (server, options, next) {
  const teamOps = TeamOps(options.dbPool, server.logger())

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { organizationId } = request.auth
      teamOps.listOrgTeams({ organizationId }, reply)
    },
    config: {
      description: 'Fetch all teams (of the current user organization)',
      notes: 'The GET /authorization/teams endpoint returns a list of all teams\n',
      tags: ['api', 'service', 'get', 'team'],
      plugins: {
        auth: {
          action: Action.ListTeams
        }
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { name, description, user } = request.payload
      const { organizationId } = request.auth

      const params = {
        name,
        description,
        parentId: null,
        organizationId,
        user
      }

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
          description: Joi.string().required().description('Description of new team'),
          user: Joi.object().optional().description('Default admin user to be added to the team').keys({
            name: Joi.string().required('Name for the user')
          })
        }
      },
      description: 'Create a teams',
      notes: 'The POST /authorization/teams endpoint creates a new team given its data\n',
      tags: ['api', 'service', 'post', 'team'],
      plugins: {
        auth: {
          action: Action.CreateTeam
        }
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.auth
      const { id } = request.params

      teamOps.readTeam({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        }
      },
      description: 'Fetch a team given its identifier',
      notes: 'The GET /authorization/teams/{id} endpoint returns a single team data\n',
      tags: ['api', 'service', 'get', 'team'],
      plugins: {
        auth: {
          action: Action.ReadTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const id = request.params.id
      const { organizationId } = request.auth
      const { name, description, users, policies } = request.payload

      const params = {
        id,
        name,
        description,
        users,
        policies,
        organizationId
      }

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
      tags: ['api', 'service', 'put', 'team'],
      plugins: {
        auth: {
          action: Action.UpdateTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.auth

      teamOps.deleteTeam({ id, organizationId }, function (err, res) {
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
      tags: ['api', 'service', 'delete', 'team'],
      plugins: {
        auth: {
          action: Action.DeleteTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}/nest',
    handler: function (request, reply) {
      const params = {
        id: request.params.id,
        parentId: request.payload.parentId
      }

      teamOps.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        },
        payload: {
          parentId: Joi.number().required().description('The new parent ID')
        }
      },
      description: 'Nest a team',
      notes: 'The PUT /authorization/teams/{id}/nest endpoint nests a team\n',
      tags: ['api', 'service', 'nest', 'team'],
      plugins: {
        auth: {
          action: Action.ManageTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}/unnest',
    handler: function (request, reply) {
      const params = {
        id: request.params.id,
        parentId: null
      }

      teamOps.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        }
      },
      description: 'Unnest a team',
      notes: 'The PUT /authorization/teams/{id}/unnest endpoint unnests a team\n',
      tags: ['api', 'service', 'nest', 'team'],
      plugins: {
        auth: {
          action: Action.ManageTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
