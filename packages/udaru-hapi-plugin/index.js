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
