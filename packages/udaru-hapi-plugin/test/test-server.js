const config = require('../config')()
const Hapi = require('hapi')

let server = null
module.exports = async function () {
  if (server) return server

  server = new Hapi.Server({
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
  await server.start()

  return server
}
