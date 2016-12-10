'use strict'

const Joi = require('joi')
const AuthorizeOps = require('./../../lib/authorizeOps')
const UserOps = require('./../../lib/userOps')
const PolicyOps = require('./../../lib/policyOps')

exports.register = function (server, options, next) {
  const authorize = AuthorizeOps(UserOps(options.dbPool, server.logger()), PolicyOps(options.dbPool))

  server.route({
    method: 'GET',
    path: '/authorization/check/{userId}/{action}/{resource*}',
    handler: function (request, reply) {
      const { resource, action, userId } = request.params
      const params = {
        userId,
        action,
        resource
      }

      authorize.isUserAuthorized(params, reply)
    },
    config: {
      description: 'Authorize user action against a resource [TBD]',
      tags: ['api', 'service', 'authorization'],
      validate: {
        params: {
          userId: Joi.number().required().description('The user that wants to perform the action on a given resource'),
          action: Joi.string().required().description('The action to check'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        }
      },
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/check/{userId}/{action}/{resource} endpoint returns is a user can perform and action\non a resource\n',
      tags: [ 'api', 'service', 'get', 'authorization', 'check' ]
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}/{resource*}',
    handler: function (request, reply) {
      const { resource, userId } = request.params
      const params = {
        userId,
        resource
      }

      authorize.listAuthorizations(params, reply)
    },
    config: {
      description: 'List all the actions a user can perform on a resource [TBD]',
      tags: ['api', 'service', 'authorization'],
      validate: {
        params: {
          userId: Joi.number().required().description('The user that wants to perform the action on a given resource'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        }
      },
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/list/{userId}/{resource} endpoint returns a list of all the actions a user\ncan perform on a given resource\n',
      tags: [ 'api', 'service', 'get', 'authorization', 'list' ]
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
