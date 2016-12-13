'use strict'

const packageJson = require('./package.json')
const config = require('./lib/config')
const dbConn = require('./lib/dbConn')

const Hapi = require('hapi')
const HapiServiceAuth = require('./hapi-auth-service')
const server = new Hapi.Server()

// need to move this to a separate file
const UserOps = require('./lib/userOps')
const PolicyOps = require('./lib/policyOps')
const AuthorizeOps = require('./lib/authorizeOps')

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

        const authPlugin = route.settings.plugins && route.settings.plugins.auth
        if (!authPlugin) {
          return callback(null, false)
        }

        // TODO: User resource from the route for now, but this needs to by dynaically generated
        // (but we need full details about a user - org & team)
        const params = {
          userId,
          action: authPlugin.action,
          resource: authPlugin.resource // for now use the resource from the rou
        }

        const authorize = AuthorizeOps(UserOps(options.dbPool, server.logger()), PolicyOps(options.dbPool))
        authorize.isUserAuthorized(params, (err, result) => {
          if (err) {
            return callback(err, false)
          }

          callback(null, result, { id: userId })
        })
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
