'use strict'

const AuthorizeOps = require('./../../lib/authorizeOps')
const UserOps = require('./../../lib/userOps')
const PolicyOps = require('./../../lib/policyOps')

exports.register = function (server, options, next) {
  const authorize = AuthorizeOps(UserOps(options.dbPool, server.logger()), PolicyOps(options.dbPool))

  // curl -X GET http://localhost:8000/authorization/check/<user_id>/<action>/<resource>
  server.route({
    method: 'GET',
    path: '/authorization/check/{userId}/{action}/{resource*}',
    handler: function (request, reply) {
      const { resource, action, userId } = request.params // TODO: get userId from token
      const params = {
        userId,
        action,
        resource
      }

      authorize.isUserAuthorized(params, reply)
    }
  })

  // curl -X GET http://localhost:8000/authorization/list/<user_id>/<resource>
  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}/{resource*}',
    handler: function (request, reply) {
      const { resource, userId } = request.params // TODO: get userId from token
      const params = {
        userId,
        resource
      }

      authorize.listAuthorizations(params, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
