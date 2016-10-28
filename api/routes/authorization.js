'use strict'

var Boom = require('boom')

exports.register = function (server, options, next) {
  const mu = options.mu

  function handleRoleCommandType (role, cmd, type, params, request, reply) {
    mu.dispatch({ role, cmd, type, params }, function (err, res) {
      if (err) {
        if (err === 'not found') return reply(Boom.notFound())
        return reply(Boom.badImplementation())
      }

      return reply(res)
    })
  }

  // curl -X GET http://localhost:8000/authorization/check/<resource>/<action>/<user_id>
  server.route({
    method: 'GET',
    path: '/authorization/check/{resource}/{action}/{userId}',
    handler: function (request, reply) {
      const { resource, action, userId } = request.params // TODO: get userId from token

      const params = {
        userId,
        action,
        resource
      }

      handleRoleCommandType('authorization', 'authorize', 'user', params, request, reply)
    }
  })

  // curl -X GET http://localhost:8000/authorization/list/<resource>/<user_id>
  server.route({
    method: 'GET',
    path: '/authorization/list/{resource}/{userId}',
    handler: function (request, reply) {
      const { resource, userId } = request.params // TODO: get userId from token

      const params = {
        userId,
        resource
      }

      handleRoleCommandType('authorization', 'list', 'authorizations', params, request, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
