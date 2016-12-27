'use strict'

const Joi = require('joi')
const userOps = require('./../../lib/ops/userOps')
const Action = require('./../../lib/config/config.auth').Action

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      userOps.listOrgUsers({ organizationId }, reply)
    },
    config: {
      description: 'Fetch all users (of the current user organization)',
      notes: 'The GET /authorization/users endpoint returns a list of all users\n',
      tags: ['api', 'service', 'get', 'users'],
      plugins: {
        auth: {
          action: Action.ListUsers
        }
      }
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
          id: Joi.number().required().description('user id')
        }
      },
      description: 'Fetch a user given its identifier',
      notes: 'The GET /authorization/users/{id} endpoint returns a single user data\n',
      tags: ['api', 'service', 'get', 'users'],
      plugins: {
        auth: {
          action: Action.ReadUser,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const params = {
        name: request.payload.name,
        organizationId
      }

      userOps.createUser(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: {
          name: Joi.string().required().description('User name')
        }
      },
      description: 'Create a new user',
      notes: 'The POST /authorization/users endpoint creates a new user given its data\n',
      tags: ['api', 'service', 'post', 'users'],
      plugins: {
        auth: {
          action: Action.CreateUser
        }
      }
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
          id: Joi.number().required().description('user id')
        }
      },
      description: 'Delete a user',
      notes: 'The DELETE /authorization/users endpoint delete a user\n',
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
      const { name, teams } = request.payload

      const params = {
        id,
        organizationId,
        name,
        teams
      }
      userOps.updateUser(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('user id')
        },
        payload: {
          name: Joi.string().required().description('user name'),
          teams: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      },
      description: 'Update a user',
      notes: 'The PUT /authorization/users endpoint updates a user data\n',
      tags: ['api', 'service', 'put', 'users'],
      plugins: {
        auth: {
          action: Action.UpdateUser,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
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
          id: Joi.number().required().description('user id')
        },
        payload: {
          policies: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      },
      description: 'Add one or more policies to a user',
      notes: 'The PUT /authorization/users/{id}/policies endpoint add one or more new policies to a user\n',
      tags: ['api', 'service', 'put', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.AddUserPolicy,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
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
          id: Joi.number().required().description('user id')
        },
        payload: {
          policies: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      },
      description: 'Clear and replace policies for a user',
      notes: 'The POST /authorization/users/{id}/policies endpoint removes all the user policies and replace them\n',
      tags: ['api', 'service', 'post', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.AddUserPolicy,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
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
          id: Joi.number().required().description('user id')
        }
      },
      description: 'Clear all user\'s policies',
      notes: 'The DELETE /authorization/users/{id}/policies endpoint removes all the user policies\n',
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
          userId: Joi.number().required().description('user id'),
          policyId: Joi.number().required().description('policy id')
        }
      },
      description: 'Remove a user\'s policy',
      notes: 'The DELETE /authorization/users/{userId}/policies/{policyId} endpoint removes a specific user\'s policy\n',
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
    method: 'GET',
    path: '/authorization/users/{id}/actions',
    handler: function (request, reply) {
      const { id } = request.params
      const { organizationId } = request.udaru
      const { resources } = request.query

      const params = {
        id,
        organizationId,
        resources: resources ? resources.split(',') : []
      }

      userOps.listActionsByResource(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('user id')
        },
        query: {
          resources: Joi.string().description('comma separated list of resources')
        }
      },
      description: 'List user\'s actions grouped by resource',
      notes: 'The GET /authorization/users/{id}/actions endpoint list user\'s actions by resource.\nA resources parameter can be used in the query string to get actions only for specific resources.',
      tags: ['api', 'service', 'list', 'users', 'actions'],
      plugins: {
        auth: {
          action: Action.ReadUser,
          getParams: (request) => ({ userId: request.params.id })
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
