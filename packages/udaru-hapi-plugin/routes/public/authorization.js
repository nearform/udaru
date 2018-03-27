'use strict'

const _ = require('lodash')
const headers = require('./../headers')
const swagger = require('./../../swagger')
const validation = require('@nearform/udaru-core/lib/ops/validation').authorize

module.exports = {
  name: 'authorization',
  version: '0.0.1',
  register (server, options) {
    const Action = server.udaruConfig.get('AuthConfig.Action')

<<<<<<< HEAD
      const params = {
        userId,
        action,
        resource,
        organizationId,
        sourceIpAddress: request.info.remoteAddress,
        sourcePort: request.info.remotePort
      }
=======
    server.route({
      method: 'GET',
      path: '/authorization/access/{userId}/{action}/{resource*}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { resource, action, userId } = request.params
>>>>>>> Updated @nearform/udaru-hapi-plugin to hapi v17.

        return request.udaruCore.authorize.isUserAuthorized({userId, action, resource, organizationId})
      },
<<<<<<< HEAD
      description: 'Authorize user action against a resource',
      notes: 'The GET /authorization/access/{userId}/{action}/{resource} endpoint answers if a user can perform an action\non a resource.\n',
      tags: ['api', 'authorization'],
      response: { schema: swagger.Access }
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
        organizationId,
        sourceIpAddress: request.info.remoteAddress,
        sourcePort: request.info.remotePort
=======
      config: {
        plugins: {
          auth: {
            action: Action.CheckAccess,
            resource: 'authorization/access'
          }
        },
        validate: {
          params: _.pick(validation.isUserAuthorized, ['userId', 'action', 'resource']),
          headers
        },
        description: 'Authorize user action against a resource',
        notes: 'The GET /authorization/access/{userId}/{action}/{resource} endpoint answers if a user can perform an action\non a resource.\n',
        tags: ['api', 'authorization'],
        response: {schema: swagger.Access}
>>>>>>> Updated @nearform/udaru-hapi-plugin to hapi v17.
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/list/{userId}/{resource*}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { resource, userId } = request.params

<<<<<<< HEAD
  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { userId } = request.params
      const { resources } = request.query
      const params = {
        userId,
        resources,
        organizationId,
        sourceIpAddress: request.info.remoteAddress,
        sourcePort: request.info.remotePort
      }

      request.udaruCore.authorize.listAuthorizationsOnResources(params, reply)
    },
    config: {
      plugins: {
        auth: {
          action: Action.ListActionsOnResources,
          resource: 'authorization/actions/resources'
        }
      },
      validate: {
        params: _.pick(validation.listAuthorizationsOnResources, ['userId']),
        query: _.pick(validation.listAuthorizationsOnResources, ['resources']),
        headers
=======
        return request.udaruCore.authorize.listActions({userId, resource, organizationId})
>>>>>>> Updated @nearform/udaru-hapi-plugin to hapi v17.
      },
      config: {
        plugins: {
          auth: {
            action: Action.ListActions,
            resource: 'authorization/actions'
          }
        },
        validate: {
          params: _.pick(validation.listAuthorizations, ['userId', 'resource']),
          headers
        },
        description: 'List all the actions a user can perform on a resource',
        notes: 'The GET /authorization/list/{userId}/{resource} endpoint returns a list of all the actions a user\ncan perform on a given resource.\n',
        tags: ['api', 'authorization'],
        response: {schema: swagger.UserActions}
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/list/{userId}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { userId } = request.params
        const { resources } = request.query

        return request.udaruCore.authorize.listAuthorizationsOnResources({userId, resources, organizationId})
      },
      config: {
        plugins: {
          auth: {
            action: Action.ListActionsOnResources,
            resource: 'authorization/actions/resources'
          }
        },
        validate: {
          params: _.pick(validation.listAuthorizationsOnResources, ['userId']),
          query: _.pick(validation.listAuthorizationsOnResources, ['resources']),
          headers
        },
        description: 'List all the actions a user can perform on a list of resources',
        notes: 'The GET /authorization/list/{userId} endpoint returns a list of all the actions a user\ncan perform on a given list of resources.\n',
        tags: ['api', 'authorization'],
        response: {schema: swagger.UserActionsOnResources}
      }
    })
  }
}
