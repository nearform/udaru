'use strict'

const config = require('./config-server')()
const Hapi = require('hapi')

const server = new Hapi.Server()

server.connection({
  port: Number(config.get('hapi.port')),
  host: config.get('hapi.host'),
  routes: {
    cors: {
      additionalHeaders: ['org']
    }
  }
})

server.register(
  [
    {
      register: require('hapi-pino'),
      options: config.get('logger.pino') || {}
    },
    {
      register: require('inert')
    },
    {
      register: require('vision')
    },
    {
      register: require('hapi-swagger'),
      options: require('./swagger-server')
    },
    {
      register: require('@nearform/hapi-auth-udaru-16'),
      options: {config}
    }
  ],
  function (err) {
    if (err) {
      throw err
    }
  }
)

module.exports = server
