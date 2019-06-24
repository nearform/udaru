'use strict'

const Joi = require('@hapi/joi')
const pick = require('lodash/pick')
const validation = require('@nearform/udaru-core/lib/ops/validation').teams
const swagger = require('@nearform/udaru-core/lib/ops/validation').swagger
const headers = require('../headers')

module.exports = {
  name: 'teams',
  version: '0.0.1',
  register (server, options) {
    const Action = server.udaruConfig.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/teams/search',
      async handler (request) {
        const { organizationId } = request.udaru
        const query = request.query.query

        return request.udaruCore.teams.search({ organizationId, query })
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
          query: pick(validation.searchTeam, ['query'])
        },
        response: { schema: swagger.Search(swagger.ShortTeam).label('FilteredTeams') }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/teams',
      async handler (request) {
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        return { page, limit, ...(await request.udaruCore.teams.list({ organizationId, limit, page })) }
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
          query: pick(validation.listOrgTeams, ['page', 'limit'])
        },
        response: { schema: swagger.PagedTeams }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/teams/{id}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { id } = request.params

        return request.udaruCore.teams.read({ id, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.readTeam, ['id']),
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
      method: 'POST',
      path: '/authorization/teams',
      async handler (request, h) {
        const { id, name, description, metadata, user } = request.payload
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.teams.create({ id, name, description, metadata, parentId: null, organizationId, user })).code(201)
      },
      config: {
        validate: {
          payload: Joi.object(pick(validation.createTeam, ['id', 'name', 'description', 'metadata', 'user'])).label('CreateTeamPayload'),
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
      method: 'PUT',
      path: '/authorization/teams/{id}',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { name, description, metadata } = request.payload

        return request.udaruCore.teams.update({ id, name, description, metadata, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.updateTeam, ['id']),
          payload: Joi.object(pick(validation.updateTeam, ['name', 'description', 'metadata'])).or('name', 'description', 'metadata').label('UpdateTeamPayload'),
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
      async handler (request, h) {
        const { id } = request.params
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.teams.delete({ id, organizationId })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteTeam, ['id']),
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
      method: 'GET',
      path: '/authorization/teams/{id}/nested',
      async handler (request) {
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1
        const { id } = request.params

        await request.udaruCore.teams.read({ id, organizationId })
        return { page, limit, ...(await request.udaruCore.teams.listNestedTeams({ organizationId, id, limit, page })) }
      },
      config: {
        validate: {
          query: pick(validation.listNestedTeams, ['page', 'limit']),
          params: pick(validation.listNestedTeams, ['id']),
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

    server.route({
      method: 'PUT',
      path: '/authorization/teams/{id}/nest',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { parentId } = request.payload

        return request.udaruCore.teams.move({ id, parentId, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.moveTeam, ['id']),
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
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru

        return request.udaruCore.teams.move({ id, parentId: null, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.moveTeam, ['id']),
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
      method: 'POST',
      path: '/authorization/teams/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { policies } = request.payload

        return request.udaruCore.teams.replacePolicies({ id, organizationId, policies })
      },
      config: {
        validate: {
          params: pick(validation.replaceTeamPolicies, ['id']),
          payload: Joi.object(pick(validation.replaceTeamPolicies, ['policies'])).label('ReplaceTeamPoliciesPayload'),
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
      method: 'PUT',
      path: '/authorization/teams/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { policies } = request.payload

        return request.udaruCore.teams.amendPolicies({ id, organizationId, policies })
      },
      config: {
        validate: {
          params: pick(validation.amendTeamPolicies, ['id']),
          payload: Joi.object(pick(validation.amendTeamPolicies, ['policies'])).label('AddPoliciesToTeamPayload'),
          headers
        },
        description: 'Add/update team policy associations (specify instance to update, omit to add)',
        notes: 'The PUT /authorization/teams/{id}/policies endpoint adds/updates the to the collection of policies associated with a team.\n',
        tags: ['api', 'teams'],
        plugins: {
          auth: {
            action: Action.AmendTeamPolicies,
            getParams: (request) => ({ teamId: request.params.id })
          }
        },
        response: { schema: swagger.Team }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/teams/{id}/policies',
      async handler (request, h) {
        const { id } = request.params
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.teams.deletePolicies({ id, organizationId })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteTeamPolicies, ['id']),
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
      method: 'GET',
      path: '/authorization/teams/{id}/policies',
      async handler  (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        await request.udaruCore.teams.read({ id, organizationId })
        return request.udaruCore.teams.listPolicies({ organizationId, id, limit, page })
      },
      config: {
        validate: {
          params: pick(validation.listTeamPolicies, ['id']),
          query: pick(validation.listTeamPolicies, ['page', 'limit']),
          headers
        },
        description: 'Fetch team policies given its identifier',
        notes: 'The GET /authorization/teams/{id}/policies endpoint returns the teams policies.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ListTeamPolicies,
            getParams: (request) => ({ id: request.params.id })
          }
        },
        response: { schema: swagger.PagedPolicyRefs }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/teams/{teamId}/policies/{policyId}',
      async handler (request, h) {
        const { teamId, policyId } = request.params
        const { organizationId } = request.udaru
        const { instance } = request.query

        return h.response(await request.udaruCore.teams.deletePolicy({ teamId, policyId, organizationId, instance })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteTeamPolicy, ['teamId', 'policyId']),
          headers
        },
        description: 'Remove a policy associated with a team',
        notes: 'The DELETE /authorization/teams/{teamId}/policies/{policyId} endpoint disassociates a policy from a team.\n' +
          'Set optional parameter instance to delete a specific policy instance with variables, or leave blank to remove all instances with this policyId.\n',
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
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        await request.udaruCore.teams.read({ id, organizationId })
        return request.udaruCore.teams.listUsers({ id, page, limit, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.readTeamUsers, ['id']),
          query: pick(validation.readTeamUsers, ['page', 'limit']),
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
      method: 'POST',
      path: '/authorization/teams/{id}/users',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { users } = request.payload

        return request.udaruCore.teams.replaceUsers({ id, users, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.replaceUsersInTeam, ['id']),
          payload: Joi.object(pick(validation.replaceUsersInTeam, ['users'])).label('ReplaceTeamUsersPayload'),
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
      method: 'PUT',
      path: '/authorization/teams/{id}/users',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { users } = request.payload

        return request.udaruCore.teams.addUsers({ id, users, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.addUsersToTeam, ['id']),
          payload: Joi.object(pick(validation.addUsersToTeam, ['users'])).label('AddTeamUsersPayload'),
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
      method: 'DELETE',
      path: '/authorization/teams/{id}/users',
      async handler (request, h) {
        const { id } = request.params
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.teams.deleteMembers({ id, organizationId })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteTeamMembers, ['id']),
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
      async handler (request, h) {
        const { id, userId } = request.params
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.teams.deleteMember({ id, userId, organizationId })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteTeamMember, ['id', 'userId']),
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
      path: '/authorization/teams/{id}/users/search',
      async handler (request) {
        const { id } = request.params
        const query = request.query.query
        const { organizationId } = request.udaru

        await request.udaruCore.teams.read({ id, organizationId })
        return request.udaruCore.teams.searchUsers({ id, query, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.searchTeamUsers, ['id']),
          query: pick(validation.searchTeamUsers, ['query']),
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
  }
}
