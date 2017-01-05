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
    path: '/authorization/users/{token}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { token } = request.params

      userOps.getIdFromToken(token, (err, id) => {
        if (err) return reply(err)

        userOps.readUser({ id, organizationId }, reply)
      })
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Fetch a user given its identifier',
      notes: 'The GET /authorization/users/{token} endpoint returns a single user data\n',
      tags: ['api', 'service', 'get', 'users'],
      plugins: {
        auth: {
          action: Action.ReadUser,
          getParams: (request) => ({ userId: request.params.token })
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
      const { name, token } = request.payload
      const params = {
        name,
        token,
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
          name: Joi.string().required().description('User name'),
          token: Joi.string().required().description('User unique identifier')
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
    path: '/authorization/users/{token}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { token } = request.params

      userOps.deleteUser({ token, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Delete a user',
      notes: 'The DELETE /authorization/users/{token} endpoint delete a user\n',
      tags: ['api', 'service', 'delete', 'users'],
      plugins: {
        auth: {
          action: Action.DeleteUser,
          getParams: (request) => ({ userId: request.params.token })
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/users/{token}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { token } = request.params
      const { name, teams } = request.payload

      const params = {
        token,
        name,
        teams,
        organizationId
      }
      userOps.updateUser(params, reply)
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        payload: {
          name: Joi.string().required().description('user name'),
          teams: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Update a user',
      notes: 'The PUT /authorization/users/{token} endpoint updates a user data\n',
      tags: ['api', 'service', 'put', 'users'],
      plugins: {
        auth: {
          action: Action.UpdateUser,
          getParams: (request) => ({ userId: request.params.token })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/users/{token}/policies',
    handler: function (request, reply) {
      const { token } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        token,
        organizationId,
        policies
      }
      userOps.addUserPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        payload: {
          policies: Joi.array().required().items(Joi.number().required())
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Add one or more policies to a user',
      notes: 'The PUT /authorization/users/{token}/policies endpoint add one or more new policies to a user\n',
      tags: ['api', 'service', 'put', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.AddUserPolicy,
          getParams: (request) => ({ userId: request.params.token })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/users/{token}/policies',
    handler: function (request, reply) {
      const { token } = request.params
      const { organizationId } = request.udaru
      const { policies } = request.payload

      const params = {
        token,
        organizationId,
        policies
      }

      userOps.replaceUserPolicies(params, reply)
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        payload: {
          policies: Joi.array().required().items(Joi.number().required())
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Clear and replace policies for a user',
      notes: 'The POST /authorization/users/{token}/policies endpoint removes all the user policies and replace them\n',
      tags: ['api', 'service', 'post', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.AddUserPolicy,
          getParams: (request) => ({ userId: request.params.token })
        }
      },
      response: {schema: swagger.User}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{token}/policies',
    handler: function (request, reply) {
      const { token } = request.params
      const { organizationId } = request.udaru

      userOps.deleteUserPolicies({ token, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Clear all user\'s policies',
      notes: 'The DELETE /authorization/users/{token}/policies endpoint removes all the user policies\n',
      tags: ['api', 'service', 'delete', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.RemoveUserPolicy,
          getParams: (request) => ({ userId: request.params.token })
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{token}/policies/{policyId}',
    handler: function (request, reply) {
      const { token, policyId } = request.params
      const { organizationId } = request.udaru

      userOps.deleteUserPolicy({ token, policyId, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {
          token: Joi.string().required().description('user token'),
          policyId: Joi.number().required().description('policy id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Remove a user\'s policy',
      notes: 'The DELETE /authorization/users/{token}/policies/{policyId} endpoint removes a specific user\'s policy\n',
      tags: ['api', 'service', 'delete', 'users', 'policies'],
      plugins: {
        auth: {
          action: Action.RemoveUserPolicy,
          getParams: (request) => ({
            userId: request.params.token,
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
