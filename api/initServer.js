'use strict'

const Hapi = require('hapi')
const config = require('./lib/config')

function init (cb) {
  const server = new Hapi.Server()

  server.connection({
    port: Number(config.get('server.port')),
    host: config.get('server.host'),
    routes: {
      cors: true
    }
  })

  const consoleOptions = config.get('logger.good.options')

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
    register: require('hapi-swagger')
  }, {
    register: require('./routes/users')
  }, {
    register: require('./routes/policies')
  }, {
    register: require('./routes/teams')
  }, {
    register: require('./routes/authorization')
  }], function (err) {
    if (err) { throw err }

    cb(server)
  })
}


module.exports = init
