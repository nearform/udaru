'use strict'

const packageJson = require('./package.json')
const config = require('./lib/config')
const dbConn = require('./lib/dbConn')

const Hapi = require('hapi')
const HapiServiceAuth = require('./hapi-auth-service')
const server = new Hapi.Server()

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
    HapiServiceAuth
  ],
  function (err) {
    if (err) {
      throw err
    }

    // TODO: extract validation function
    server.auth.strategy('default', 'service', 'required', {
      validateFunc: (request, userId, callback) => {
        const { route } = request

        const action = route.settings.plugins &&
          route.settings.plugins.auth &&
          route.settings.plugins.auth.action

        console.log(userId)
        console.log(action)
        console.log(route.path)

        console.log('Let\'s go iam-js...')

        callback(null, true, { id: userId, name: 'John' })
      },
      unauthorizedAttributes: {
        allow: false
      }
    })
  }
)

const db = dbConn.create(server.logger())
const options = { dbPool: db.pool }

server.register(
  [
    {
      register: require('./preHandler/user'),
      options
    },
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
