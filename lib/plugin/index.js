'use strict'

const buildUdaru = require('./../core')
const buildAuthorization = require('./security/authorization')
const buildHapiAuthService = require('./security/hapi-auth-service')
const buildAuthValidation = require('./security/hapi-auth-validation')

const buildConfig = require('../config')
const defaultConfig = require('../config/default.plugin')
const defaultConfigCore = require('../config/default.core')

function register (server, options, next) {
  const config = buildConfig(defaultConfigCore, defaultConfig, options.config || {})
  const { decorateUdaruCore = true } = config
  const udaru = buildUdaru(options.dbPool, config)
  if (decorateUdaruCore) {
    server.decorate('request', 'udaruCore', udaru)
  }
  server.decorate('server', 'udaruConfig', config)

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
  pkg: require('./../../package')
}
