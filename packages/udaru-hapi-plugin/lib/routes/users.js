'use strict'

const Joi = require('joi')
const pick = require('lodash/pick')
const validation = require('@nearform/udaru-core/lib/ops/validation').users
const swagger = require('@nearform/udaru-core/lib/ops/validation').swagger
const headers = require('../headers')

module.exports = {
  name: 'users',
  version: '0.0.1',
  register (server, options) {
    const Action = server.udaruConfig.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/users/search',
      async handler (request) {
        const { organizationId } = request.udaru
        const query = request.query.query

        return request.udaruCore.users.search({ organizationId, query })
      },
      config: {
        description: 'Search for users from the current organization',
        notes: 'The get /authorization/users/search endpoint returns a filtered list of users from the current organization.\n\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.SearchUsers
          }
        },
        validate: {
          headers,
          query: pick(validation.searchUser, ['query'])
        },
        response: { schema: swagger.SearchUser }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/users',
      async handler (request, h) {
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        return { page, limit, ...(await request.udaruCore.users.list({ organizationId, limit, page })) }
      },
      config: {
        description: 'Fetch all users from the current user organization',
        notes: 'The GET /authorization/users endpoint returns a list of all users from the current organization.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.ListUsers
          }
        },
        validate: {
          headers,
          query: pick(validation.listOrgUsers, ['page', 'limit'])
        },
        response: { schema: swagger.PagedUsers }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/users/{id}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { id } = request.params

        return request.udaruCore.users.read({ id, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.readUser, ['id']),
          headers
        },
        description: 'Fetch a user given its identifier',
        notes: 'The GET /authorization/users/{id} endpoint returns a single user data.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.ReadUser,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/users',
      async handler (request, h) {
        const { organizationId } = request.udaru
        const { id, name, metadata } = request.payload

        return h.response(await request.udaruCore.users.create({ id, name, organizationId, metadata })).code(201)
      },
      config: {
        validate: {
          payload: Joi.object(pick(validation.createUser, ['id', 'name', 'metadata'])).label('CreateUserPayload'),
          headers
        },
        description: 'Create a new user',
        notes: 'The POST /authorization/users endpoint creates a new user given its data.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.CreateUser
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/users/{id}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { id } = request.params
        const { name, metadata } = request.payload

        return request.udaruCore.users.update({ id, organizationId, name, metadata })
      },
      config: {
        validate: {
          params: pick(validation.updateUser, ['id']),
          payload: Joi.object(pick(validation.updateUser, ['name', 'metadata'])).label('UpdateUserPayload'),
          headers
        },
        description: 'Update a user',
        notes: 'The PUT /authorization/users/{id} endpoint updates the user data.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.UpdateUser,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/users/{id}',
      async handler (request, h) {
        const { organizationId } = request.udaru
        const { id } = request.params

        await request.udaruCore.users.delete({ id, organizationId })

        return h.response().code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteUser, ['id']),
          headers
        },
        description: 'Delete a user',
        notes: 'The DELETE /authorization/users/{id} endpoint deletes a user.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.DeleteUser,
            getParams: (request) => ({ userId: request.params.id })
          }
        }
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/users/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { policies } = request.payload

        return request.udaruCore.users.replacePolicies({ id, organizationId, policies })
      },
      config: {
        validate: {
          params: pick(validation.replaceUserPolicies, ['id']),
          payload: Joi.object(pick(validation.replaceUserPolicies, ['policies'])).label('ReplaceUserPoliciesPayload'),
          headers
        },
        description: 'Clear and replace policies for a user',
        notes: 'The POST /authorization/users/{id}/policies endpoint replaces all the user policies. Existing user policies are removed.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.ReplaceUserPolicy,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/users/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { policies } = request.payload

        return request.udaruCore.users.amendPolicies({ id, organizationId, policies })
      },
      config: {
        validate: {
          params: pick(validation.amendUserPolicies, ['id']),
          payload: Joi.object(pick(validation.amendUserPolicies, ['policies'])).label('AddUserPoliciesPayload'),
          headers
        },
        description: 'Add/update user policy associations (specify instance to update, omit to add)',
        notes: 'The PUT /authorization/users/{id}/policies endpoint adds/updates the to the collection of policies associated with a user.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.AmendUserPolicies,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/users/{id}/policies',
      async handler (request, h) {
        const { id } = request.params
        const { organizationId } = request.udaru

        await request.udaruCore.users.deletePolicies({ id, organizationId })
        return h.response().code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteUserPolicies, ['id']),
          headers
        },
        description: 'Clear all user\'s policies',
        notes: 'The DELETE /authorization/users/{id}/policies endpoint removes all the user policies.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.RemoveUserPolicy,
            getParams: (request) => ({ userId: request.params.id })
          }
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/users/{id}/policies',
      async handler  (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        await request.udaruCore.users.read({ id, organizationId })
        return request.udaruCore.users.listPolicies({ organizationId, id, limit, page })
      },
      config: {
        validate: {
          params: pick(validation.listUserPolicies, ['id']),
          query: pick(validation.listUserPolicies, ['page', 'limit']),
          headers
        },
        description: 'Fetch users policies given its identifier',
        notes: 'The GET /authorization/users/{id}/policies endpoint returns the users policies.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ListUserPolicies,
            getParams: (request) => ({ id: request.params.id })
          }
        },
        response: { schema: swagger.PagedPolicyRefs }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/users/{userId}/policies/{policyId}',
      async handler (request, h) {
        const { userId, policyId } = request.params
        const { organizationId } = request.udaru
        const { instance } = request.query

        await request.udaruCore.users.deletePolicy({ userId, policyId, organizationId, instance })
        return h.response().code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteUserPolicy, ['userId', 'policyId']),
          headers
        },
        description: 'Remove a policy associated with a user',
        notes: 'The DELETE /authorization/users/{userId}/policies/{policyId} disassociates a policy from a user.\n' +
          'Set optional parameter instance to delete a specific policy instance with variables, or leave blank to remove all instances with this policyId.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.RemoveUserPolicy,
            getParams: (request) => ({
              userId: request.params.userId,
              policyId: request.params.policyId
            })
          }
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/users/{id}/teams',
      async handler (request, h) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        await request.udaruCore.users.read({ id, organizationId })
        return { page, limit, ...(await request.udaruCore.users.listUserTeams({ id, organizationId, limit, page })) }
      },
      config: {
        validate: {
          headers,
          params: pick(validation.listUserTeams, ['id']),
          query: pick(validation.listUserTeams, ['page', 'limit'])
        },
        description: 'Fetch all teams to which the user belongs to. Does not fetch parent teams.',
        notes: 'The GET /authorization/users/{id}/teams endpoint returns a list of teams to which the user belongs to.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.ListUserTeams,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.PagedTeamRefs }
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/users/{id}/teams',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const { teams } = request.payload

        return request.udaruCore.users.replaceTeams({ id, organizationId, teams })
      },
      config: {
        validate: {
          params: pick(validation.replaceUserTeams, ['id']),
          payload: Joi.object(pick(validation.replaceUserTeams, ['teams'])).label('ReplaceUserTeamsPayload'),
          headers
        },
        description: 'Clear and replace user teams',
        notes: 'The POST /authorization/users/{id}/teams endpoint replaces all the user teams. This can be use to move a user from a team to another (or a set of teams to another).\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.ReplaceUserTeams,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/users/{id}/teams',
      async handler (request) {
        const { id } = request.params
        const { organizationId } = request.udaru

        return request.udaruCore.users.deleteTeams({ id, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.deleteUserFromTeams, ['id']),
          headers
        },
        description: 'Delete teams for a user',
        notes: 'The DELETE /authorization/users/{id}/teams endpoint deletes user from all her teams.\n',
        tags: ['api', 'users'],
        plugins: {
          auth: {
            action: Action.DeleteUserTeams,
            getParams: (request) => ({ userId: request.params.id })
          }
        },
        response: { schema: swagger.User }
      }
    })
  }
}
