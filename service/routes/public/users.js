'use strict'

const Joi = require('joi')
const userOps = require('./../../lib/ops/userOps')
const Action = require('./../../lib/config/config.auth').Action
const swagger = require('./../../swagger')

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
      },
      validate: {
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      response: {schema: swagger.UserList}
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
          id: Joi.string().required().description('user id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Fetch a user given its identifier',
      notes: 'The GET /authorization/users/{id} endpoint returns a single user data\n',
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
          id: Joi.string().description('user id'),
          name: Joi.string().required().description('User name')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Create a new user',
      notes: 'The POST /authorization/users endpoint creates a new user given its data\n',
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
          id: Joi.string().required().description('user id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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
          id: Joi.string().required().description('user id')
        },
        payload: {
          name: Joi.string().required().description('user name')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Update a user',
      notes: 'The PUT /authorization/users endpoint updates a user data\n',
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
          id: Joi.string().required().description('user id')
        },
        payload: {
          policies: Joi.array().required().items(Joi.string().required())
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Add one or more policies to a user',
      notes: 'The PUT /authorization/users/{id}/policies endpoint add one or more new policies to a user\n',
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
          id: Joi.string().required().description('user id')
        },
        payload: {
          policies: Joi.array().required().items(Joi.string().required())
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Clear and replace policies for a user',
      notes: 'The POST /authorization/users/{id}/policies endpoint removes all the user policies and replace them\n',
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
          id: Joi.string().required().description('user id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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
          userId: Joi.string().required().description('user id'),
          policyId: Joi.string().required().description('policy id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
