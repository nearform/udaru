'use strict'

var Hapi = require('hapi')
var config = require('./lib/config')

function init (cb) {
  let server = new Hapi.Server()

  server.connection({
    port: Number(config.get('server.port')),
    host: config.get('server.host'),
    routes: {
      cors: true
    }
  })

  var consoleOptions = config.get('logger.good.options')

  server.register([{
    register: require('good'),
    options: consoleOptions
  }, {
    register: require('h2o2')
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
