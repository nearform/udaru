'use strict'

const udaru = require('./../module')
const HapiAuthService = require('./security/hapi-auth-service')
const authValidation = require('./security/hapi-auth-validation')

function register (server, options, next) {
  server.app.udaru = udaru

  server.register(
    [
      {
        register: require('./routes/public/users')
      },
      {
        register: require('./routes/public/policies')
      },
      {
        register: require('./routes/public/teams')
      },
      {
        register: require('./routes/public/authorization')
      },
      {
        register: require('./routes/public/organizations')
      },
      {
        register: require('./routes/public/monitor')
      },
      {
        register: require('./routes/private/policies')
      },
      HapiAuthService
    ],
    function (err) {
      if (err) {
        throw err
      }

      server.auth.strategy('default', 'service', 'required', {
        validateFunc: authValidation.bind(null, {})
      })
    }
  )
}

module.exports.register = register

module.exports.register.attributes = {
  pkg: require('./../../package')
}
