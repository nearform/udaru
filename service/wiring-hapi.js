'use strict'

const packageJson = require('./package.json')
const config = require('./lib/config')

const Hapi = require('hapi')
const server = new Hapi.Server()

const HapiAuthService = require('./security/hapi-auth-service')
const authValidation = require('./security/hapi-auth-validation')

server.connection({
  port: Number(config.get('hapi.port')),
  host: config.get('hapi.host'),
  routes: {
    cors: true
  }
})

const swaggerOptions = {
  info: {
    title: 'Authorization API Documentation',
    version: packageJson.version
  },
  basePath: '/authorization',
  pathPrefixSize: 2,
  tags: [
    {
      name: 'organizations',
      description: 'Manage organizations'
    }
    // TBD
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
    HapiAuthService
  ],
  function (err) {
    if (err) {
      throw err
    }

    server.auth.strategy('default', 'service', 'required', {
      validateFunc: authValidation.bind(null, {})
    })
  }
)

server.register(
  [
    {
      register: require('./routes/public/users')
    },
    {
      register: require('./routes/public/policies')
    },
    {
      register: require('./routes/public/teams')
    },
    {
      register: require('./routes/public/authorization')
    },
    {
      register: require('./routes/public/organizations')
    },
    {
      register: require('./routes/private/policies')
    }
  ],
  function (err) {
    if (err) {
      throw err
    }
  }
)

module.exports = server
