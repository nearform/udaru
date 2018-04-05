'use strict'

const buildUdaru = require('@nearform/udaru-core')
const buildAuthorization = require('./authentication/authorization')
const buildHapiAuthService = require('./authentication/hapi-auth-service')
const buildAuthValidation = require('./authentication/hapi-auth-validation')

const buildConfig = require('./config')

function register (server, options, next) {
  const config = buildConfig(options.config)
  const udaru = buildUdaru(options.dbPool, config)

  // If there are hooks to register
  if (typeof options.hooks === 'object') {
    for (const hook of Object.keys(options.hooks)) { // For each hook
      // Normalize handlers to always be an array and only consider functions
      let handlers = options.hooks[hook]
      if (!Array.isArray(handlers)) handlers = [handlers]
      handlers = handlers.filter(f => typeof f === 'function')

      // Register each handler
      for (const handler of handlers) udaru.hooks.add(hook, handler)
    }
  }

  server.decorate('server', 'udaru', udaru)
  server.decorate('server', 'udaruConfig', config)
  server.decorate('request', 'udaruCore', udaru)

  const authorization = buildAuthorization(config)
  const HapiAuthService = buildHapiAuthService(authorization)
  const authValidation = buildAuthValidation(authorization)

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
        return next(err)
      }

      server.auth.strategy('default', 'service', 'required', {
        validateFunc: authValidation.bind(null, {})
      })

      return next()
    }
  )
}

module.exports.register = register

module.exports.register.attributes = {
  pkg: require('./package')
}
