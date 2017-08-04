'use strict'

const config = require('../plugin/config')

const Hapi = require('hapi')
const server = new Hapi.Server()

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
    },
    {
      register: require('inert')
    },
    {
      register: require('vision')
    },
    {
      register: require('hapi-swagger'),
      options: require('../plugin/config/swagger')
    },
    {
      register: require('../plugin')
    }
  ],
  function (err) {
    if (err) {
      throw err
    }
  }
)

module.exports = server
