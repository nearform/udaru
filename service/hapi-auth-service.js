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
        return reply(Boom.unauthorized(null, 'Basic', settings.unauthorizedAttributes))
      }

      const userId = parseInt(authorization, 10)

      settings.validateFunc(request, userId, (err, isValid, credentials) => {
        credentials = credentials || null

        if (err) {
          return reply(err, null, { credentials: credentials })
        }

        if (!isValid) {
          return reply(Boom.unauthorized('Bad username or password', 'Basic', settings.unauthorizedAttributes), null, { credentials: credentials })
        }

        if (!credentials ||
          typeof credentials !== 'object') {

          return reply(Boom.badImplementation('Bad credentials object received'))
        }

        return reply.continue({ credentials: credentials })
      })
    }
  }

  return scheme
}
