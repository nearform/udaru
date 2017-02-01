'use strict'

const Hoek = require('hoek')
const authorization = require('./authorization')

const internals = {}

exports.register = function (server, options, next) {
  server.auth.scheme('service', internals.implementation)

  next()
}

exports.register.attributes = {
  name: 'Service',
  version: '0.0.1'
}

internals.implementation = function (server, options) {
  Hoek.assert(options, 'Missing service auth strategy options')
  Hoek.assert(typeof options.validateFunc === 'function', 'options.validateFunc must be a valid function in service scheme')

  const settings = Hoek.clone(options)

  const scheme = {
    authenticate: function authenticate (request, reply) {
      authorization.authorize(server, settings, request, reply)
    },

    payload: function payload (request, reply) {
      if (authorization.needTeamsValidation(request)) {
        return authorization.validateTeamsInPayload(server, request, reply)
      }

      reply.continue()
    },

    options: {
      payload: true
    }
  }

  return scheme
}
