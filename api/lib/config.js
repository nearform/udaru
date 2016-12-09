const Reconfig = require('reconfig')

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
  }
}, { envPrefix: 'LABS_AUTH_API' })
