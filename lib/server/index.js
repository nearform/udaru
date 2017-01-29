'use strict'

const packageJson = require('../../package.json')
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

const swaggerOptions = {
  jsonEditor: true,
  reuseDefinitions: false,
  info: {
    title: 'Authorization API Documentation',
    version: packageJson.version
  },
  tags: [
    {
      name: 'organizations',
      description: 'Manage organizations'
    }
  ]
}

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
      options: swaggerOptions
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
