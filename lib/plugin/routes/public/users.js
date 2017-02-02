'use strict'

const _ = require('lodash')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const config = require('../../config')

exports.register = function (server, options, next) {
  const udaru = server.app.udaru
  const Action = config.get('AuthConfig.Action')

  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || config.get('authorization.defaultPageSize')
      const page = request.query.page || 1

      udaru.users.list({organizationId, limit, page}, (err, data, total) => {
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
      description: 'Fetch all users from the current user organization',
      notes: 'The GET /authorization/users endpoint returns a list of all users from the current organization.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'service', 'get', 'users'],
      plugins: {
        auth: {
          action: Action.ListUsers
        }
      },
      validate: {
        headers,
        query: _.pick(udaru.users.list.validate, ['page', 'limit'])
      },
      response: {schema: swagger.List(swagger.User).label('PagedUsers')}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const id = request.params.id

      udaru.users.read({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.read.validate, ['id']),
        headers
      },
      description: 'Fetch a user given its identifier',
      notes: 'The GET /authorization/users/{id} endpoint returns a single user data.\n',
      tags: ['api', 'service', 'get', 'users'],
      plugins: {
        auth: {
          action: Action.ReadUser,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id, name } = request.payload

      udaru.users.create({ id, name, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: _.pick(udaru.users.create.validate, ['id', 'name']),
        headers
      },
      description: 'Create a new user',
      notes: 'The POST /authorization/users endpoint creates a new user given its data.\n',
      tags: ['api', 'service', 'post', 'users'],
      plugins: {
        auth: {
          action: Action.CreateUser
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const id = request.params.id

      udaru.users.delete({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.users.delete.validate, ['id']),
        headers
      },
      description: 'Delete a user',
      notes: 'The DELETE /authorization/users/{id} endpoint deletes a user.\n',
      tags: ['api', 'service', 'delete', 'users'],
      plugins: {
        auth: {
          action: Action.DeleteUser,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const id = request.params.id
      const { name } = request.payload

      const params = {
        id,
        organizationId,
        name
      }
      udaru.users.update(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.update.validate, ['id']),
        payload: _.pick(udaru.users.update.validate, ['name']),
        headers
      },
      description: 'Update a user',
      notes: 'The PUT /authorization/users/{id} endpoint updates the user data.\n',
      tags: ['api', 'service', 'put', 'users'],
      plugins: {
        auth: {
          action: Action.UpdateUser,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        id,
        organizationId,
        policies
      }
      udaru.users.addPolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.addPolicies.validate, ['id']),
        payload: _.pick(udaru.users.addPolicies.validate, ['policies']),
        headers
      },
      description: 'Add one or more policies to a user',
      notes: 'The PUT /authorization/users/{id}/policies endpoint adds one or more policies to a user.\n',
      tags: ['api', 'service', 'put', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.AddUserPolicy,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/users/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        id,
        organizationId,
        policies
      }

      udaru.users.replacePolicies(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.replacePolicies.validate, ['id']),
        payload: _.pick(udaru.users.replacePolicies.validate, ['policies']),
        headers
      },
      description: 'Clear and replace policies for a user',
      notes: 'The POST /authorization/users/{id}/policies endpoint replaces all the user policies. Existing user policies are removed.\n',
      tags: ['api', 'service', 'post', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.ReplaceUserPolicy,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      udaru.users.deletePolicies({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.users.deletePolicies.validate, ['id']),
        headers
      },
      description: 'Clear all user\'s policies',
      notes: 'The DELETE /authorization/users/{id}/policies endpoint removes all the user policies.\n',
      tags: ['api', 'service', 'delete', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.RemoveUserPolicy,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{userId}/policies/{policyId}',
    handler: function (request, reply) {
      const { userId, policyId } = request.params
      const { organizationId } = request.udaru

      udaru.users.deletePolicy({ userId, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(udaru.users.deletePolicy.validate, ['userId', 'policyId']),
        headers
      },
      description: 'Remove a user\'s policy',
      notes: 'The DELETE /authorization/users/{userId}/policies/{policyId} endpoint removes a specific user\'s policy.\n',
      tags: ['api', 'service', 'delete', 'users', 'policies'],
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
    method: 'POST',
    path: '/authorization/users/{id}/teams',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { teams } = request.payload

      const params = {
        id,
        organizationId,
        teams
      }

      udaru.users.replaceTeams(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.replaceTeams.validate, ['id']),
        payload: _.pick(udaru.users.replaceTeams.validate, ['teams']),
        headers
      },
      description: 'Clear and replace user teams',
      notes: 'The POST /authorization/users/{id}/teams endpoint replaces all the user teams. This can be use to move a user from a team to another (or a set of teams to another).\n',
      tags: ['api', 'service', 'post', 'users', 'teams'],
      plugins: {
        auth: {
          action: Action.ReplaceUserTeams,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}/teams',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru

      const params = {
        id,
        organizationId
      }

      udaru.users.deleteTeams(params, reply)
    },
    config: {
      validate: {
        params: _.pick(udaru.users.deleteTeams.validate, ['id']),
        headers
      },
      description: 'Delete teams for a user',
      notes: 'The DELETE /authorization/users/{id}/teams endpoint deletes user from all her teams.\n',
      tags: ['api', 'service', 'post', 'users', 'teams'],
      plugins: {
        auth: {
          action: Action.DeleteUserTeams,
          getParams: (request) => ({ userId: request.params.id })
        }
      },
      response: {schema: swagger.User}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
