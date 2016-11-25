const Reconfig = require('reconfig')

module.exports = new Reconfig({
  server: {
    port: 8000,
    host: 'localhost'
  },
  mu: {
    port: 8080,
    host: 'localhost'
  }
}, { envPrefix: 'LABS_AUTH_API' })
