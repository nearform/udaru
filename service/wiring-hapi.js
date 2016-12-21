'use strict'

const packageJson = require('./package.json')
const config = require('./lib/config')
const dbConn = require('./lib/dbConn')

const Hapi = require('hapi')
const server = new Hapi.Server()

const HapiAuthService = require('./hapi-auth-service')
const authValidation = require('./hapi-auth-validation')

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
      validateFunc: authValidation.bind(null, options)
    })
  }
)

const db = dbConn.create(server.logger())
const options = { dbPool: db.pool }

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
    if (err) {
      throw err
    }
  }
)

module.exports = server
