'use strict'

const buildUdaru = require('@nearform/udaru-core')
const buildConfig = require('./config')
const buildAuthorization = require('./security/authorization')
const buildHapiAuthService = require('./security/hapi-auth-service')
const buildAuthValidation = require('./security/hapi-auth-validation')

module.exports = {
  pkg: require('./../../package'),

  async register (server, options) {
    const config = buildConfig(options.config)
    const { decorateUdaruCore = true } = config

    if (decorateUdaruCore) {
      const udaru = buildUdaru(options.dbPool, config)
      server.decorate('request', 'udaruCore', udaru)
    }
    server.decorate('server', 'udaruConfig', config)

    const authorization = buildAuthorization(config)
    const HapiAuthService = buildHapiAuthService(authorization)
    const authValidation = buildAuthValidation(authorization)

    await server.register([
      require('./routes/public/users'),
      require('./routes/public/policies'),
      require('./routes/public/teams'),
      require('./routes/public/authorization'),
      require('./routes/public/organizations'),
      require('./routes/public/monitor'),
      require('./routes/private/policies'),
      HapiAuthService
    ])

    server.auth.strategy('udaru', 'udaru', {validateFunc: authValidation.bind(null, {})})
    server.auth.default({mode: 'required', strategy: 'udaru'})
  }
}
