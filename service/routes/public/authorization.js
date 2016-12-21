'use strict'

const Joi = require('joi')
const AuthorizeOps = require('./../../lib/authorizeOps')
const PolicyOps = require('./../../lib/policyOps')

exports.register = function (server, options, next) {
  const authorize = AuthorizeOps(PolicyOps(options.dbPool))

  server.route({
    method: 'GET',
    path: '/authorization/check/{userId}/{action}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.auth
      const { resource, action, userId } = request.params
      const params = {
        userId,
        action,
        resource,
        organizationId
      }

      authorize.isUserAuthorized(params, reply)
    },
    config: {
      auth: false,
      validate: {
        params: {
          userId: Joi.number().required().description('The user that wants to perform the action on a given resource'),
          action: Joi.string().required().description('The action to check'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        }
      },
      description: 'Authorize user action against a resource [TBD]',
      notes: 'The GET /authorization/check/{userId}/{action}/{resource} endpoint returns is a user can perform and action\non a resource\n',
      tags: ['api', 'service', 'authorization']
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.auth
      const { resource, userId } = request.params
      const params = {
        userId,
        resource,
        organizationId
      }

      authorize.listAuthorizations(params, reply)
    },
    config: {
      auth: false,
      validate: {
        params: {
          userId: Joi.number().required().description('The user that wants to perform the action on a given resource'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        }
      },
      description: 'List all the actions a user can perform on a resource',
      notes: 'The GET /authorization/list/{userId}/{resource} endpoint returns a list of all the actions a user\ncan perform on a given resource\n',
      tags: ['api', 'service', 'authorization']
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
