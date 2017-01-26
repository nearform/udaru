'use strict'

const Joi = require('joi')
const teamOps = require('./../../lib/ops/teamOps')
const Action = require('./../../lib/config/config.auth').Action
const conf = require('./../../lib/config')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      teamOps.listOrgTeams({
        organizationId,
        limit: limit,
        page: page
      }, (err, data, total) => {
        reply(
          err,
          err ? null : {
            page: page,
            limit: limit,
            total: total,
            data: data
          }
        )
      })
    },
    config: {
      description: 'Fetch all teams from the current user organization',
      notes: 'The GET /authorization/teams endpoint returns a list of all teams from the current organization.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'service', 'get', 'team'],
      plugins: {
        auth: {
          action: Action.ListTeams
        }
      },
      validate: {
        headers,
        query: Joi.object({
          page: Joi.number().integer().min(1).description('Page number, starts from 1'),
          limit: Joi.number().integer().min(1).description('Items per page')
        }).required()
      },
      response: {schema: swagger.List(swagger.Team).label('PagedTeams')}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { id, name, description, user } = request.payload
      const { organizationId } = request.udaru

      const params = {
        id,
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
          id: Joi.string().regex(/^[0-9a-zA-Z_]+$/).allow('').description('The ID to be used for the new team. Only alphanumeric characters and underscore are supported'),
          name: Joi.string().required().description('Name of the new team'),
          description: Joi.string().required().description('Description of new team'),
          user: Joi.object().description('Default admin of the team').keys({
            id: Joi.string().description('User ID'),
            name: Joi.string().required('User name')
          })
        },
        headers
      },
      description: 'Create a team',
      notes: 'The POST /authorization/teams endpoint creates a new team from its payload data.\n',
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
          id: Joi.string().required().description('Team ID')
        },
        headers
      },
      description: 'Fetch a team given its identifier',
      notes: 'The GET /authorization/teams/{id} endpoint returns a single team data.\n',
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
      const { name, description } = request.payload

      const params = {
        id,
        name,
        description,
        organizationId
      }

      teamOps.updateTeam(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        payload: Joi.object().keys({
          name: Joi.string().description('Team name'),
          description: Joi.string().description('Team description')
        }).or('name', 'description'),
        headers
      },
      description: 'Update a team',
      notes: 'The PUT /authorization/teams/{id} endpoint updates a team data.\n',
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
          id: Joi.string().required().description('The team ID')
        },
        headers
      },
      description: 'Delete a team',
      notes: 'The DELETE /authorization/teams endpoint deletes a team.\n',
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

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        payload: {
          parentId: Joi.string().required().description('The new parent ID')
        },
        headers
      },
      description: 'Nest a team',
      notes: 'The PUT /authorization/teams/{id}/nest endpoint nests a team.\n',
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

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        headers
      },
      description: 'Unnest a team',
      notes: 'The PUT /authorization/teams/{id}/unnest endpoint unnests a team.\n',
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
          id: Joi.string().required().description('Team ID')
        },
        payload: {
          policies: Joi.array().items(Joi.string()).required().description('Policy IDs')
        },
        headers
      },
      description: 'Add one or more policies to a team',
      notes: 'The PUT /authorization/teams/{id}/policies endpoint adds one or more new policies to a team.\n',
      tags: ['api', 'service', 'put', 'teams', 'policies'],
      plugins: {
        auth: {
          action: Action.AddTeamPolicy,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
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
          id: Joi.string().required().description('Team ID')
        },
        payload: {
          policies: Joi.array().items(Joi.string()).required().description('Policy IDs')
        },
        headers
      },
      description: 'Clear and replace policies for a team',
      notes: 'The POST /authorization/teams/{id}/policies endpoint replaces all the team policies. Existing policies are removed.\n',
      tags: ['api', 'service', 'post', 'teams', 'policies'],
      plugins: {
        auth: {
          action: Action.ReplaceTeamPolicy,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
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
          id: Joi.string().required().description('Team ID')
        },
        headers
      },
      description: 'Clear all team policies',
      notes: 'The DELETE /authorization/teams/{id}/policies endpoint removes all the team policies.\n',
      tags: ['api', 'service', 'delete', 'teams', 'policies'],
      plugins: {
        auth: {
          action: Action.RemoveTeamPolicy,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
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
          teamId: Joi.string().required().description('Team ID'),
          policyId: Joi.string().required().description('Policy ID')
        },
        headers
      },
      description: 'Remove a team policy',
      notes: 'The DELETE /authorization/teams/{teamId}/policies/{policyId} endpoint removes a specific team policy.\n',
      tags: ['api', 'service', 'delete', 'teams', 'policies'],
      plugins: {
        auth: {
          action: Action.RemoveTeamPolicy,
          getParams: (request) => ({ teamId: request.params.teamId })
        }
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}/users',
    handler: function (request, reply) {
      const { id } = request.params
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1

      teamOps.readTeamUsers({ id, page, limit }, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        query: {
          page: Joi.number().integer().min(1).required().description('Page number, starts from 1'),
          limit: Joi.number().integer().min(1).required().description('Users per page')
        },
        headers
      },
      description: 'Fetch team users given its identifier',
      notes: 'The GET /authorization/teams/{id}/users endpoint returns the team users and pagination metadata.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'service', 'get', 'team', 'users'],
      plugins: {
        auth: {
          action: Action.ReadTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.List(swagger.User).label('PagedUsers')}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}/users',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { users } = request.payload

      const params = {
        id,
        users,
        organizationId
      }

      teamOps.addUsersToTeam(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('The team ID')
        },
        payload: Joi.object().keys({
          users: Joi.array().items(Joi.string()).description('User IDs')
        }),
        headers
      },
      description: 'Add team users',
      notes: 'The PUT /authorization/teams/{id}/users endpoint adds one or more team users.',
      tags: ['api', 'service', 'put', 'team', 'users'],
      plugins: {
        auth: {
          action: Action.AddTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams/{id}/users',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { users } = request.payload

      const params = {
        id,
        users,
        organizationId
      }

      teamOps.replaceUsersInTeam(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        payload: Joi.object().keys({
          users: Joi.array().items(Joi.string()).description('User IDs')
        }),
        headers
      },
      description: 'Replace team users with the given ones',
      notes: 'The POST /authorization/teams/{id}/users endpoint replaces all team users. Existing team users are removed.',
      tags: ['api', 'service', 'post', 'team', 'users'],
      plugins: {
        auth: {
          action: Action.ReplaceTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: {schema: swagger.Team}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}/users',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      teamOps.deleteTeamMembers({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Team ID')
        },
        headers
      },
      description: 'Delete all team users',
      notes: 'The DELETE /authorization/teams/{id}/users endpoint removes all team users.',
      tags: ['api', 'service', 'delete', 'team', 'users'],
      plugins: {
        auth: {
          action: Action.RemoveTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}/users/{userId}',
    handler: function (request, reply) {
      const { id, userId } = request.params
      const { organizationId } = request.udaru

      teamOps.deleteTeamMember({ id, userId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('The team ID'),
          userId: Joi.string().required().description('The user ID')
        },
        headers
      },
      description: 'Delete one team member',
      notes: 'The DELETE /authorization/teams/{id}/users/{userId} endpoint removes one user from a team.',
      tags: ['api', 'service', 'delete', 'team', 'users'],
      plugins: {
        auth: {
          action: Action.RemoveTeamMember,
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
