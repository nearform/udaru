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
        ops: {
          interval: 1000
        },
        reporters: {
          goodConsole: [{
            module: 'good-console',
            args: [{ log: '*', response: '*' }]
          }]
        }
      }
    }
  }
}, { envPrefix: 'LABS_AUTH_API' })
