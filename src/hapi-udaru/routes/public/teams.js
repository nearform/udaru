'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Action = require('./../../lib/config/config.auth').Action
const conf = require('./../../lib/config')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {
  const udaru = server.app.udaru

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      udaru.teams.list({
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
        query: _.pick(udaru.teams.list.validate, ['page', 'limit'])
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

      udaru.teams.create(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: _.pick(udaru.teams.create.validate, ['id', 'name', 'description', 'user']),
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

      udaru.teams.read({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.read.validate, ['id']),
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

      udaru.teams.update(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.update.validate, ['id']),
        payload: Joi.object(_.pick(udaru.teams.update.validate, ['name', 'description'])).or('name', 'description'),
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

      udaru.teams.delete({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.delete.validate, ['id']),
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

      udaru.teams.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.move.validate, ['id']),
        payload: {
          parentId: udaru.teams.move.validate.parentId.required()
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

      udaru.teams.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.move.validate, ['id']),
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
      udaru.teams.addPolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.addPolicies.validate, ['id']),
        payload: _.pick(udaru.teams.addPolicies.validate, ['policies']),
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

      udaru.teams.replacePolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.replacePolicies.validate, ['id']),
        payload: _.pick(udaru.teams.replacePolicies.validate, ['policies']),
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

      udaru.teams.deletePolicies({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.deletePolicies.validate, ['id']),
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

      udaru.teams.deletePolicy({ teamId, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.deletePolicy.validate, ['teamId', 'policyId']),
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
      const { organizationId } = request.udaru
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1

      udaru.teams.listUsers({ id, page, limit, organizationId }, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.listUsers.validate, ['id']),
        query: _.pick(udaru.teams.listUsers.validate, ['page', 'limit']),
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

      udaru.teams.addUsers(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.addUsers.validate, ['id']),
        payload: _.pick(udaru.teams.addUsers.validate, ['users']),
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

      udaru.teams.replaceUsers(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.replaceUsers.validate, ['id']),
        payload: _.pick(udaru.teams.replaceUsers.validate, ['users']),
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

      udaru.teams.deleteMembers({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.deleteMembers.validate, ['id']),
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

      udaru.teams.deleteMember({ id, userId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.teams.deleteMember.validate, ['id', 'userId']),
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
