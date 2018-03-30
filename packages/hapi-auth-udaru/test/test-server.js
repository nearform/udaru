const config = require('../lib/config')()
const Action = config.get('AuthConfig.Action')
const Hapi = require('hapi')

let server = null

module.exports = async function () {
  if (server) return server

  server = Hapi.Server({
    port: Number(config.get('hapi.port')),
    host: config.get('hapi.host'),
    routes: {
      cors: {
        additionalHeaders: ['org']
      },
      validate: { // This is to propagate validation keys in Hapi v17 - https://github.com/hapijs/hapi/issues/3706#issuecomment-349765943
        async failAction (request, h, err) {
          throw err
        }
      }
    }
  })

  await server.register({plugin: require('..'), options: {config}})

  server.route({
    method: 'GET',
    path: '/no/plugins',
    async handler (request) {
      return true
    },
    config: {
      plugins: {}
    }
  })

  server.route({
    method: 'GET',
    path: '/no/resource',
    async handler (request) {
      return true
    },
    config: {
      plugins: {
        auth: {
          action: Action.CheckAccess
        }
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/no/team-resource/{id}',
    async handler (request) {
      return true
    },
    config: {
      plugins: {
        auth: {
          action: Action.DeleteUserTeams,
          getParams: (request) => ({ userId: request.params.id })
        }
      }
    }
  })

  await server.start()

  return server
}
