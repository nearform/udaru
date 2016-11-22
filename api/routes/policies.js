'use strict'

exports.register = function (server, options, next) {
   // curl http://localhost:8000/authorization/policies
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      const params = null

      options.handleRoleCommandType('authorization', 'list', 'policies', params, request, reply)
    }
  })

  // curl http://localhost:8000/authorization/policy/123
  server.route({
    method: 'GET',
    path: '/authorization/policy/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      options.handleRoleCommandType('authorization', 'read', 'policy', params, request, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'policies',
  version: '0.0.1'
}
