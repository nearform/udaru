'use strict'

const Boom = require('boom')
const Hoek = require('hoek')

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
    authenticate: function (request, reply) {
      const req = request.raw.req

      const authorization = req.headers.authorization
      if (!authorization) {
        return reply(Boom.unauthorized('Missing authorization', 'udaru'))
      }

      const userId = String(authorization)

      settings.validateFunc(server, request, userId, (err, credentials) => {
        if (err) return reply(err)

        request.udaru = credentials

        return reply.continue({ credentials: { scope: 'udaru' } })
      })
    }
  }

  return scheme
}
