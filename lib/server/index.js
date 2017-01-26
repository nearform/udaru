'use strict'

const packageJson = require('../../package.json')
const config = require('./lib/config')

const Hapi = require('hapi')
const server = new Hapi.Server({debug: false})

const HapiAuthService = require('./security/hapi-auth-service')
const authValidation = require('./security/hapi-auth-validation')

server.connection({
  port: Number(config.get('hapi.port')),
  host: config.get('hapi.host'),
  routes: {
    cors: true
  }
})

server.app.udaru = require('./../udaru')(config._rawConfig)

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
      register: require('./routes/public/monitor')
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
