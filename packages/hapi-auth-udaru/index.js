'use strict'

const buildUdaru = require('@nearform/udaru-core')
const buildConfig = require('./lib/config')
const buildAuthorization = require('./lib/authorization')
const HapiAuthService = require('./lib/authentication')

module.exports = {
  pkg: require('./package'),

  async register (server, options) {
    const config = buildConfig(options.config)
    const udaru = buildUdaru(options.dbPool, config)

    server.decorate('server', 'udaru', udaru)
    server.decorate('server', 'udaruConfig', config)
    server.decorate('server', 'udaruAuthorization', buildAuthorization(config))
    server.decorate('request', 'udaruCore', udaru)

    await server.register([
      require('./lib/routes/users'),
      require('./lib/routes/policies'),
      require('./lib/routes/teams'),
      require('./lib/routes/authorization'),
      require('./lib/routes/organizations'),
      require('./lib/routes/monitor'),
      HapiAuthService
    ])

    server.auth.strategy('udaru', 'udaru')
    server.auth.default({ mode: 'required', strategy: 'udaru' })
  }
}
