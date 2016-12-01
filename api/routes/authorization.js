'use strict'

const config = require('../lib/config')

exports.register = function (server, options, next) {
  // curl -X GET http://localhost:8000/authorization/check/<user_id>/<action>/<resource>
  server.route({
    method: 'GET',
    path: '/authorization/check/{userId}/{action}/{resource*}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  // curl -X GET http://localhost:8000/authorization/list/<user_id>/<resource>
  server.route({
    method: 'GET',
    path: '/authorization/list/{userId}/{resource*}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  next()
}

exports.register.attributes = {
  name: 'authorization',
  version: '0.0.1'
}
