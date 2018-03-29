'use strict'

const Hoek = require('hoek')

module.exports = function (authorization) {
  return {
    name: 'Udaru Authentication',
    version: '0.0.1',

    async register (server, options) {
      server.auth.scheme('udaru', function (server, options) {
        Hoek.assert(options, 'Missing service auth strategy options')
        Hoek.assert(typeof options.validateFunc === 'function', 'options.validateFunc must be a valid function in service scheme')

        const settings = Hoek.clone(options)

        const scheme = {
          authenticate: async function (request, h) {
            return h.authenticated(await authorization.authorize(server, settings, request))
          },

          payload: function (request, h) {
            if (authorization.needTeamsValidation(request)) {
              return authorization.validateTeamsInPayload(server, request, h)
            }

            return h.continue
          },

          options: {
            payload: true
          }
        }

        return scheme
      })
    }
  }
}
