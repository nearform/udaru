'use strict'

const UserOps = require('./../lib/userOps')
const Boom = require('boom')

function fetchOrganizationId (organizationId, request) {
  if (organizationId === 'ROOT' && request.headers && request.headers.organization_id) {
    return request.headers.organization_id
  }

  return organizationId
}

exports.register = function (server, options, next) {
  const userOps = UserOps(options.dbPool, server.logger)

  server.ext('onPreHandler', (request, reply) => {
    if (request.headers && request.headers.authorization) {
      userOps.getUserOrganizationId(request.headers.authorization, function (err, organizationId) {
        if (err) return reply(err)

        organizationId = fetchOrganizationId(organizationId, request)
        if (!organizationId) return reply(Boom.badRequest('The current user does not belong to any organization'))

        request.authorization = {
          organization: {
            id: organizationId
          }
        }
        reply.continue()
      })

      return
    }

    reply.continue()
  })

  next()
}

exports.register.attributes = {
  name: 'user-data',
  version: '0.0.1'
}
