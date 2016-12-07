const Reconfig = require('reconfig')
const appVersion = require('../package.json').version

module.exports = new Reconfig({
  server: {
    port: 8000,
    host: 'localhost'
  },
  service: {
    port: 8080,
    host: 'localhost'
  },
  logger: {
    good: {
      options: {
        opsInterval: 1000,
        reporters: [{ reporter: 'good-console', events: { log: '*', response: '*' } }]
      }
    }
  },
  swagger: {
    host: 'localhost:8000',
    info: {
      title: 'Labs Authorization API',
      version: appVersion
    }
  }
}, { envPrefix: 'LABS_AUTH_API' })
