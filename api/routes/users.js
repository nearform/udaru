'use strict'

const config = require('../lib/config')

exports.register = function (server, options, next) {

  // curl http://localhost:8000/authorization/users
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  // curl http://localhost:8000/authorization/users/123
  server.route({
    method: 'GET',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    }
  })

  // curl http://localhost:8000/authorization/users -X POST -H 'Content-Type: application/json' -d '{"name":"Violet Beauregarde"}'
  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  // curl -X DELETE http://localhost:8000/authorization/users/123
  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  // curl -X PUT http://localhost:8000/authorization/users/1 -H "Content-Type: application/json" -d '{"id": 1, "name": "Mrs Beauregarde",
  // "teams":[{"id": 3, "name": "Dream Team"}], "policies":[{"id": 4, "name": "DROP ALL TABLES!"}, { "id": 2, "name": "THROW DESK" }]}'
  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      return reply.proxy(config.get('service'))
    },
    config: { payload: { parse: false } }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
