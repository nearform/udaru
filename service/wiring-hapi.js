'use strict'

const config = require('./lib/config')
const dbConn = require('./lib/dbConn')

var Hapi = require('hapi')
var server = new Hapi.Server()

server.connection({
  port: Number(config.get('hapi.port')),
  host: config.get('hapi.host'),
  routes: {
    cors: true
  }
})

server.register(
  [
    {
      register: require('hapi-pino'),
      options: config.get('logger.pino') || {}
    }
  ],
  function (err) {
    if (err) { throw err }
  }
)

const db = dbConn.create(server.logger())
var options = {dbPool: db.pool}

server.register(
  [
    {
      register: require('./routes/public/users'),
      options
    },
    {
      register: require('./routes/public/policies'),
      options
    },
    {
      register: require('./routes/public/teams'),
      options
    },
    {
      register: require('./routes/public/authorization'),
      options
    },
    {
      register: require('./routes/public/organizations'),
      options
    },
    {
      register: require('./routes/private/policies'),
      options
    }
  ],
  function (err) {
    if (err) { throw err }
  }
)

module.exports = server
