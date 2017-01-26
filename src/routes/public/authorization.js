'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Action = require('./../../lib/config/config.auth').Action
const udaru = require('./../../udaru')
const headers = require('./../headers')
const swagger = require('./../../swagger')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/access/{userId}/{action}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { resource, action, userId } = request.params

      const params = {
        userId,
        action,
        resource,
        organizationId
      }

      udaru.authorize.isUserAuthorized(params, reply)
    },
    config: {
      plugins: {
        auth: {
          action: Action.CheckAccess,
          resource: 'authorization/access'
        }
      },
      validate: {
        params: _.pick(udaru.authorize.isUserAuthorized.validate, ['userId', 'action', 'resource']),
        headers
      },
      description: 'Authorize user action against a resource',
      notes: 'The GET /authorization/access/{userId}/{action}/{resource} endpoint answers if a user can perform an action\non a resource.\n',
      tags: ['api', 'service', 'authorization'],
      response: {schema: swagger.Access}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}/{resource*}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { resource, userId } = request.params
      const params = {
        userId,
        resource,
        organizationId
      }

      udaru.authorize.listActions(params, reply)
    },
    config: {
      plugins: {
        auth: {
          action: Action.ListActions,
          resource: 'authorization/actions'
        }
      },
      validate: {
        params: _.pick(udaru.authorize.listActions.validate, ['userId', 'resource']),
        headers
      },
      description: 'List all the actions a user can perform on a resource',
      notes: 'The GET /authorization/list/{userId}/{resource} endpoint returns a list of all the actions a user\ncan perform on a given resource.\n',
      tags: ['api', 'service', 'authorization'],
      response: {schema: swagger.UserActions}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
