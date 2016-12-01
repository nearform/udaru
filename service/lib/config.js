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
  hapi: {
    port: 8080,
    host: 'localhost'
  },
  logger: {
    pino: {
      level: 'info'
    }
  },
  security: {
    api_service_keys: {
      private: [
        '123456789'
      ]
    }
  }
}, { envPrefix: 'LABS_AUTH_SERVICE' })
