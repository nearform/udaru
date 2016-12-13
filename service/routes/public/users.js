'use strict'

const Joi = require('joi')
const UserOps = require('./../../lib/userOps')

exports.register = function (server, options, next) {
  const userOps = UserOps(options.dbPool, server.logger())

  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      userOps.listAllUsers({}, reply)
    },
    config: {
      description: 'Fetch all users',
      notes: 'The GET /authorization/users endpoint returns a list of all users\n',
      tags: [ 'api', 'service', 'get', 'users' ]
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const userId = request.params.id

      userOps.readUserById(userId, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('user id')
        }
      },
      description: 'Fetch a user given its identifier',
      notes: 'The GET /authorization/users/{id} endpoint returns a single user data\n',
      tags: [ 'api', 'service', 'get', 'users' ]
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      const params = {
        name: request.payload.name,
        organizationId: 'WONKA' // TODO: hardcode the org_id for now (as not yet fully implemented)
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
      tags: [ 'api', 'service', 'post', 'users' ]
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      userOps.deleteUserById(params, function (err, res) {
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
      tags: [ 'api', 'service', 'delete', 'users' ]
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const id = request.params.id
      const { policies, teams, name } = request.payload
      const params = [
        id,
        name,
        teams,
        policies
      ]

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
          })),
          policies: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      },
      description: 'Update a user',
      notes: 'The PUT /authorization/users endpoint updates a user data\n',
      tags: [ 'api', 'service', 'put', 'users' ]
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
