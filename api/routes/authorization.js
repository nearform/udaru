'use strict'

exports.register = function (server, options, next) {
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

      options.handleRoleCommandType('authorization', 'authorize', 'user', params, request, reply)
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

      options.handleRoleCommandType('authorization', 'list', 'authorizations', params, request, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
