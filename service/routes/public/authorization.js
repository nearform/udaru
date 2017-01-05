'use strict'

const Joi = require('joi')
const Action = require('./../../lib/config/config.auth').Action

const authorize = require('./../../lib/ops/authorizeOps')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/access/{token}/{action}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { resource, action, token } = request.params

      const params = {
        token,
        action,
        resource,
        organizationId
      }

      authorize.isUserAuthorized(params, reply)
    },
    config: {
      plugins: {
        auth: {
          action: Action.CheckAccess,
          resource: 'authorization/access'
        }
      },
      validate: {
        params: {
          token: Joi.string().required().description('The user token that identifies the user'),
          action: Joi.string().required().description('The action to check'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Authorize user action against a resource',
      notes: 'The GET /authorization/check/{token}/{action}/{resource} endpoint returns if a user can perform and action\non a resource\n',
      tags: ['api', 'service', 'authorization'],
      response: {schema: Joi.object({
        access: Joi.boolean()
      })}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/list/{token}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { resource, token } = request.params
      const params = {
        token,
        resource,
        organizationId
      }

      authorize.listAuthorizations(params, reply)
    },
    config: {
      plugins: {
        auth: {
          action: Action.ListActions,
          resource: 'authorization/actions'
        }
      },
      validate: {
        params: {
          token: Joi.string().required().description('The user token that identifies the user'),
          resource: Joi.string().required().description('The resource that the user wants to perform the action on')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'List all the actions a user can perform on a resource',
      notes: 'The GET /authorization/list/{token}/{resource} endpoint returns a list of all the actions a user\ncan perform on a given resource\n',
      tags: ['api', 'service', 'authorization'],
      response: {schema: Joi.object({
        actions: Joi.array().items(Joi.string())
      })}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
