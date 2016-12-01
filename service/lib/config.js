const Reconfig = require('reconfig')

module.exports = new Reconfig({
  pgdb: {
    user: 'postgres',
    database: 'authorization',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
  },
  mu: {
    port: 8080,
    host: 'localhost',
    logLevel: 'info'
  },
  hapi: {
    port: 8080,
    host: 'localhost'
  },
  logger: {
    pino: {
      level: 'info'
    }
  }
}, { envPrefix: 'LABS_AUTH_SERVICE' })
