'use strict'

const pick = require('lodash/pick')
const validation = require('@nearform/udaru-core/lib/ops/validation').authorize
const swagger = require('@nearform/udaru-core/lib/ops/validation').swagger
const headers = require('../headers')

module.exports = {
  name: 'authorization',
  version: '0.0.1',
  register (server, options) {
    const Action = server.udaruConfig.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/access/{userId}/{action}/{resource*}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { resource, action, userId } = request.params
        const { remoteAddress: sourceIpAddress, remotePort: sourcePort } = request.info

        return request.udaruCore.authorize.isUserAuthorized({userId, action, resource, organizationId, sourceIpAddress, sourcePort})
      },
      config: {
        plugins: {
          auth: {
            action: Action.CheckAccess,
            resource: 'authorization/access'
          }
        },
        validate: {
          params: pick(validation.isUserAuthorized, ['userId', 'action', 'resource']),
          headers
        },
        description: 'Authorize user action against a resource',
        notes: 'The GET /authorization/access/{userId}/{action}/{resource} endpoint answers if a user can perform an action\non a resource.\n',
        tags: ['api', 'authorization'],
        response: {schema: swagger.Access}
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/list/{userId}/{resource*}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { resource, userId } = request.params
        const { remoteAddress: sourceIpAddress, remotePort: sourcePort } = request.info

        return request.udaruCore.authorize.listActions({ userId, resource, organizationId, sourceIpAddress, sourcePort })
      },
      config: {
        plugins: {
          auth: {
            action: Action.ListActions,
            resource: 'authorization/actions'
          }
        },
        validate: {
          params: pick(validation.listAuthorizations, ['userId', 'resource']),
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

        return request.udaruCore.authorize.listAuthorizationsOnResources({ userId, resources, organizationId })
      },
      config: {
        plugins: {
          auth: {
            action: Action.ListActionsOnResources,
            resource: 'authorization/actions/resources'
          }
        },
        validate: {
          params: pick(validation.listAuthorizationsOnResources, ['userId']),
          query: pick(validation.listAuthorizationsOnResources, ['resources']),
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
