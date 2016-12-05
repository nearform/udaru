'use strict'

const Boom = require('boom')
const OrganizationOps = require('./../../lib/organizationOps')

exports.register = function (server, options, next) {
  const organizationOps = OrganizationOps(options.dbPool, server.logger())

  server.route({
    method: 'GET',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      organizationOps.list([], reply)
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      organizationOps.readById(request.params.id, reply)
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      if (!request.payload.id || !request.payload.name || !request.payload.description) return reply(Boom.badRequest())

      const params = {
        id: request.payload.id,
        name: request.payload.name,
        description: request.payload.description
      }

      organizationOps.create(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      organizationOps.deleteById(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id,
        request.payload.name,
        request.payload.description
      ]

      organizationOps.update(params, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'organizations',
  version: '0.0.1'
}
