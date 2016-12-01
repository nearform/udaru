'use strict'

const PolicyOps = require('./../../lib/policyOps')
const security = require('./../security')
const Boom = require('boom')

function isValidCreateRequest (request) {
  return request.payload.version &&
    request.payload.name &&
    request.payload.orgId &&
    request.payload.statements
}

exports.register = function (server, options, next) {
  const policyOps = PolicyOps(options.dbPool)

  server.route({
    method: 'POST',
    path: '/authorization/policies',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())
      if (!isValidCreateRequest(request)) return reply(Boom.badRequest())

      const { version, name, orgId, statements } = request.payload
      const params = [version, name, orgId, statements]

      policyOps.createPolicy(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())
      if (!isValidCreateRequest(request)) return reply(Boom.badRequest())

      const { version, name, orgId, statements } = request.payload
      const params = [request.params.id, version, name, orgId, statements]

      policyOps.updatePolicy(params, reply)
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      policyOps.deletePolicyById([request.params.id], function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(204)
      })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'provate-policies',
  version: '0.0.1'
}
