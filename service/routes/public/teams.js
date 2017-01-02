'use strict'

const Joi = require('joi')
const teamOps = require('./../../lib/ops/teamOps')
const Action = require('./../../lib/config/config.auth').Action
const swagger = require('./../../swagger')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
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
      },
      validate: {
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      response: {schema: swagger.TeamList}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { name, description, user } = request.payload
      const { organizationId } = request.udaru

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
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Create a teams',
      notes: 'The POST /authorization/teams endpoint creates a new team given its data\n',
      tags: ['api', 'service', 'post', 'team'],
      plugins: {
        auth: {
          action: Action.CreateTeam
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      teamOps.readTeam({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Fetch a team given its identifier',
      notes: 'The GET /authorization/teams/{id} endpoint returns a single team data\n',
      tags: ['api', 'service', 'get', 'team'],
      plugins: {
        auth: {
          action: Action.ReadTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { name, description, users } = request.payload

      const params = {
        id,
        name,
        description,
        users,
        organizationId
      }

      teamOps.updateTeam(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('The team ID')
        },
        payload: Joi.object().keys({
          name: Joi.string().description('Updated team name'),
          description: Joi.string().description('Updated team description'),
          users: Joi.array().description('User ids')
        }).or('name', 'description', 'users'),
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Update a team',
      notes: 'The PUT /authorization/teams endpoint updates a team data\n',
      tags: ['api', 'service', 'put', 'team'],
      plugins: {
        auth: {
          action: Action.UpdateTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

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
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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
      const { organizationId } = request.udaru

      const params = {
        id: request.params.id,
        parentId: request.payload.parentId,
        organizationId
      }

      teamOps.moveTeam(params, function (err, res) {
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
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Nest a team',
      notes: 'The PUT /authorization/teams/{id}/nest endpoint nests a team\n',
      tags: ['api', 'service', 'nest', 'team'],
      plugins: {
        auth: {
          action: Action.ManageTeams,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}/unnest',
    handler: function (request, reply) {
      const { organizationId } = request.udaru

      const params = {
        id: request.params.id,
        parentId: null,
        organizationId
      }

      teamOps.moveTeam(params, function (err, res) {
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
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Unnest a team',
      notes: 'The PUT /authorization/teams/{id}/unnest endpoint unnests a team\n',
      tags: ['api', 'service', 'nest', 'team'],
      plugins: {
        auth: {
          action: Action.ManageTeams,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        id,
        organizationId,
        policies
      }
      teamOps.addTeamPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('Team id')
        },
        payload: {
          policies: Joi.array().items(Joi.number()).required().description('Policy ids')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Add one or more policies to a team',
      notes: 'The PUT /authorization/teams/{id}/policies endpoint add one or more new policies to a team\n',
      tags: ['api', 'service', 'put', 'teams', 'policies'],
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        id,
        organizationId,
        policies
      }

      teamOps.replaceTeamPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('Team id')
        },
        payload: {
          policies: Joi.array().items(Joi.number()).required().description('Policy ids')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Clear and replace policies for a team',
      notes: 'The POST /authorization/teams/{id}/policies endpoint removes all the team policies and replace them\n',
      tags: ['api', 'service', 'post', 'teams', 'policies'],
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      teamOps.deleteTeamPolicies({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('Team id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Clear all team policies',
      notes: 'The DELETE /authorization/teams/{id}/policies endpoint removes all the team policies\n',
      tags: ['api', 'service', 'delete', 'teams', 'policies'],
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{teamId}/policies/{policyId}',
    handler: function (request, reply) {
      const { teamId, policyId } = request.params
      const { organizationId } = request.udaru

      teamOps.deleteTeamPolicy({ teamId, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          teamId: Joi.number().required().description('Team id'),
          policyId: Joi.number().required().description('Policy id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Remove a team policy',
      notes: 'The DELETE /authorization/teams/{teamId}/policies/{policyId} endpoint removes a specific team policy\n',
      tags: ['api', 'service', 'delete', 'teams', 'policies'],
      response: {schema: swagger.Team}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
