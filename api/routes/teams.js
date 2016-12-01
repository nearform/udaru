'use strict'

const config = require('../lib/config')

exports.register = function (server, options, next) {

  // curl http://localhost:8000/authorization/teams
  server.route({
    method: 'GET',
    path: '/authorization/teams',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  // curl http://localhost:8000/authorization/teams
  server.route({
    method: 'POST',
    path: '/authorization/teams',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  // curl http://localhost:8000/authorization/teams/123
  server.route({
    method: 'GET',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  // curl -X PUT http://localhost:8000/authorization/teams/123 -H 'Content-Type: application/json' -d '{ "id": 9, "name": "Sys Admins", "description": "System administrator team",
  // "users": [{ "id": 4, "name": "Tom Watson"}, { "id": 7, "name": "Michael O'Brien"}], "policies": [{ "id": 12, "name": "Financial info access"}]}'
  server.route({
    method: 'PUT',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  // curl -X DELETE http://localhost:8000/authorization/teams/123
  server.route({
    method: 'DELETE',
    path: '/authorization/teams/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  next()
}

exports.register.attributes = {
  name: 'teams',
  version: '0.0.1'
}
