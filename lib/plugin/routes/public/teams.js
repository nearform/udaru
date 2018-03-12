'use strict'

const _ = require('lodash')
const Joi = require('joi')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('../../../core/lib/ops/validation').teams

exports.register = function (server, options, next) {
  const Action = server.udaruConfig.get('AuthConfig.Action')

  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      request.udaruCore.teams.list({
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
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ListTeams
        }
      },
      validate: {
        headers,
        query: _.pick(validation.listOrgTeams, ['page', 'limit'])
      },
      response: { schema: swagger.PagedTeams }
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
      const { id, name, description, metadata, user } = request.payload
      const { organizationId } = request.udaru

      const params = {
        id,
        name,
        description,
        metadata,
        parentId: null,
        organizationId,
        user
      }

      request.udaruCore.teams.create(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: Joi.object(_.pick(validation.createTeam, ['id', 'name', 'description', 'metadata', 'user'])).label('CreateTeamPayload'),
        headers
      },
      description: 'Create a team',
      notes: 'The POST /authorization/teams endpoint creates a new team from its payload data.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.CreateTeam
        }
      },
      response: { schema: swagger.Team }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      request.udaruCore.teams.read({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.readTeam, ['id']),
        headers
      },
      description: 'Fetch a team given its identifier',
      notes: 'The GET /authorization/teams/{id} endpoint returns a single team data.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ReadTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { name, description, metadata } = request.payload

      const params = {
        id,
        name,
        description,
        metadata,
        organizationId
      }

      request.udaruCore.teams.update(params, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.updateTeam, ['id']),
        payload: Joi.object(_.pick(validation.updateTeam, ['name', 'description', 'metadata'])).or('name', 'description', 'metadata').label('UpdateTeamPayload'),
        headers
      },
      description: 'Update a team',
      notes: 'The PUT /authorization/teams/{id} endpoint updates a team data.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.UpdateTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      request.udaruCore.teams.delete({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteTeam, ['id']),
        headers
      },
      description: 'Delete a team',
      notes: 'The DELETE /authorization/teams endpoint deletes a team.\n',
      tags: ['api', 'teams'],
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

      request.udaruCore.teams.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.moveTeam, ['id']),
        payload: Joi.object({ parentId: validation.moveTeam.parentId.required() }).label('NestTeamPayload'),
        headers
      },
      description: 'Nest a team',
      notes: 'The PUT /authorization/teams/{id}/nest endpoint nests a team.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ManageTeams,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
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

      request.udaruCore.teams.move(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(200)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.moveTeam, ['id']),
        headers
      },
      description: 'Unnest a team',
      notes: 'The PUT /authorization/teams/{id}/unnest endpoint unnests a team.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ManageTeams,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
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
      request.udaruCore.teams.addPolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.addTeamPolicies, ['id']),
        payload: Joi.object(_.pick(validation.addTeamPolicies, ['policies'])).label('AddPoliciesToTeamPayload'),
        headers
      },
      description: 'Add one or more policies to a team',
      notes: 'The PUT /authorization/teams/{id}/policies endpoint adds one or more new policies to a team.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.AddTeamPolicy,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
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

      request.udaruCore.teams.replacePolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.replaceTeamPolicies, ['id']),
        payload: Joi.object(_.pick(validation.replaceTeamPolicies, ['policies'])).label('ReplaceTeamPoliciesPayload'),
        headers
      },
      description: 'Clear and replace policies for a team',
      notes: 'The POST /authorization/teams/{id}/policies endpoint replaces all the team policies. Existing policies are removed.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ReplaceTeamPolicy,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      request.udaruCore.teams.deletePolicies({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteTeamPolicies, ['id']),
        headers
      },
      description: 'Clear all team policies',
      notes: 'The DELETE /authorization/teams/{id}/policies endpoint removes all the team policies.\n',
      tags: ['api', 'teams'],
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

      request.udaruCore.teams.deletePolicy({ teamId, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteTeamPolicy, ['teamId', 'policyId']),
        headers
      },
      description: 'Remove a team policy',
      notes: 'The DELETE /authorization/teams/{teamId}/policies/{policyId} endpoint removes a specific team policy.\n',
      tags: ['api', 'teams'],
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
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1

      request.udaruCore.teams.read({ id, organizationId }, (err) => {
        if (err) return reply(err)

        request.udaruCore.teams.listUsers({ id, page, limit, organizationId }, reply)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.readTeamUsers, ['id']),
        query: _.pick(validation.readTeamUsers, ['page', 'limit']),
        headers
      },
      description: 'Fetch team users given its identifier',
      notes: 'The GET /authorization/teams/{id}/users endpoint returns the team users and pagination metadata.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ReadTeam,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.PagedUsers }
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

      request.udaruCore.teams.addUsers(params, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.addUsersToTeam, ['id']),
        payload: Joi.object(_.pick(validation.addUsersToTeam, ['users'])).label('AddTeamUsersPayload'),
        headers
      },
      description: 'Add team users',
      notes: 'The PUT /authorization/teams/{id}/users endpoint adds one or more team users.',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.AddTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
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

      request.udaruCore.teams.replaceUsers(params, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.replaceUsersInTeam, ['id']),
        payload: Joi.object(_.pick(validation.replaceUsersInTeam, ['users'])).label('ReplaceTeamUsersPayload'),
        headers
      },
      description: 'Replace team users with the given ones',
      notes: 'The POST /authorization/teams/{id}/users endpoint replaces all team users. Existing team users are removed.',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ReplaceTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.Team }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}/users',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      request.udaruCore.teams.deleteMembers({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteTeamMembers, ['id']),
        headers
      },
      description: 'Delete all team users',
      notes: 'The DELETE /authorization/teams/{id}/users endpoint removes all team users.',
      tags: ['api', 'teams'],
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

      request.udaruCore.teams.deleteMember({ id, userId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteTeamMember, ['id', 'userId']),
        headers
      },
      description: 'Delete one team member',
      notes: 'The DELETE /authorization/teams/{id}/users/{userId} endpoint removes one user from a team.',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.RemoveTeamMember,
          getParams: (request) => ({ teamId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/search',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const query = request.query.query

      request.udaruCore.teams.search({
        organizationId,
        query
      }, (err, data, total) => {
        reply(
          err,
          err ? null : {
            data,
            total
          }
        )
      })
    },
    config: {
      description: 'Search for teams from the current user organization',
      notes: 'The GET /authorization/teams/search endpoint returns a filtered list of teams from the current organization.\n\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.SearchTeams
        }
      },
      validate: {
        headers,
        query: _.pick(validation.searchTeam, ['query'])
      },
      response: { schema: swagger.Search(swagger.ShortTeam).label('FilteredTeams') }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}/users/search',
    handler: function (request, reply) {
      const { id } = request.params
      const query = request.query.query
      const { organizationId } = request.udaru

      request.udaruCore.teams.read({ id, organizationId }, (err) => {
        if (err) return reply(err)

        request.udaruCore.teams.searchUsers({ id, query, organizationId }, (err, data, total) => {
          reply(
            err,
            err ? null : {
              data,
              total
            }
          )
        })
      })
    },
    config: {
      validate: {
        params: _.pick(validation.searchTeamUsers, ['id']),
        query: _.pick(validation.searchTeamUsers, ['query']),
        headers
      },
      description: 'Search for users in a team from the current user organization',
      notes: 'The GET /authorization/teams/{id}/users/search endpoint returns the team users matching the query.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.SearchTeamsUsers,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.SearchUser }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}/nested',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      const { id } = request.params

      request.udaruCore.teams.read({ id, organizationId }, (err, data) => {
        if (err) return reply(err)

        request.udaruCore.teams.listNestedTeams({ organizationId, id, limit, page }, (err, data, total) => {
          reply(err, err
            ? null
            : {
              data,
              total,
              page: page,
              limit: limit
            })
        })
      })
    },
    config: {
      validate: {
        query: _.pick(validation.listNestedTeams, ['page', 'limit']),
        params: _.pick(validation.listNestedTeams, ['id']),
        headers
      },
      description: 'Fetch a nested team given its identifier',
      notes: 'The GET /authorization/teams/{id}/nested endpoint returns a list of team data.\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.ListNestedTeams,
          getParams: (request) => ({ teamId: request.params.id })
        }
      },
      response: { schema: swagger.NestedPagedTeams }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
