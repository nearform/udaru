'use strict'

const Hapi = require('hapi')
const config = require('./config')()

module.exports = async function start () {
  const server = new Hapi.Server({
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

  await server.register(
    [
      {
        plugin: require('hapi-pino'),
        options: config.get('logger.pino')
      },
      {
        plugin: require('inert')
      },
      {
        plugin: require('vision')
      },
      {
        plugin: require('hapi-swagger'),
        options: require('./swagger-config')
      },
      {
        plugin: require('@nearform/udaru-hapi-plugin'),
        options: {config}
      }
    ],
  )

  return server
}
