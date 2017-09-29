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
  const udaru = buildUdaru(options.dbPool, config)

  const authorization = buildAuthorization(udaru, config)
  const HapiAuthService = buildHapiAuthService(udaru, config, authorization)
  const authValidation = buildAuthValidation(udaru, config, authorization)

  server.register(
    [
      {
        register: require('./routes/public/users')(udaru, config)
      },
      {
        register: require('./routes/public/policies')(udaru, config)
      },
      {
        register: require('./routes/public/teams')(udaru, config)
      },
      {
        register: require('./routes/public/authorization')(udaru, config)
      },
      {
        register: require('./routes/public/organizations')(udaru, config)
      },
      {
        register: require('./routes/public/monitor')(udaru, config)
      },
      {
        register: require('./routes/private/policies')(udaru, config)
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
