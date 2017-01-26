'use strict'

const Joi = require('joi')
const userOps = require('./../../lib/ops/userOps')
const Action = require('./../../lib/config/config.auth').Action
const conf = require('./../../lib/config')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1

      userOps.listOrgUsers({organizationId, limit, page}, (err, data, total) => {
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
        query: Joi.object({
          page: Joi.number().integer().min(1).description('Page number, starts from 1'),
          limit: Joi.number().integer().min(1).description('Users per page')
        }).required()
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

      userOps.readUser({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('User ID')
        },
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

      userOps.createUser({ id, name, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: {
          id: Joi.string().description('User ID'),
          name: Joi.string().required().description('User name')
        },
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

      userOps.deleteUser({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('user ID')
        },
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
      userOps.updateUser(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('user ID')
        },
        payload: {
          name: Joi.string().required().description('user name')
        },
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
      userOps.addUserPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('User ID')
        },
        payload: {
          policies: Joi.array().required().items(Joi.string().required())
        },
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

      userOps.replaceUserPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('User ID')
        },
        payload: {
          policies: Joi.array().required().items(Joi.string().required())
        },
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

      userOps.deleteUserPolicies({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('User ID')
        },
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

      userOps.deleteUserPolicy({ userId, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          userId: Joi.string().required().description('User ID'),
          policyId: Joi.string().required().description('Policy ID')
        },
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

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
