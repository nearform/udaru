'use strict'

const buildConfig = require('../config')
const defaultConfig = require('../config/default.server')
const config = buildConfig(defaultConfig)

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
      options: require('../plugin/config/swagger')
    },
    {
      register: require('../plugin'),
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
