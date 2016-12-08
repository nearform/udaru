'use strict'

const Hapi = require('hapi')
const config = require('./lib/config')

const init = (cb) => {
  const server = new Hapi.Server()

  server.connection({
    port: Number(config.get('server.port')),
    host: config.get('server.host'),
    routes: {
      cors: true
    }
  })

  const consoleOptions = config.get('logger.good.options')
  const swaggerOptions = config.get('swagger')

  server.register([{
    register: require('good'),
    options: consoleOptions
  }, {
    register: require('h2o2')
  }, {
    register: require('inert')
  }, {
    register: require('vision')
  }, {
    register: require('hapi-swagger'),
    options: swaggerOptions
  }, {
    register: require('./routes/users')
  }, {
    register: require('./routes/policies')
  }, {
    register: require('./routes/teams')
  }, {
    register: require('./routes/authorization')
  }], (err) => {
    if (err) { throw err }
    cb(server)
  })
}


module.exports = init
