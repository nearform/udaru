'use strict'

const config = require('./config')()
const Hapi = require('hapi')

const server = new Hapi.Server()

// if forked as child, send output message via ipc to parent
// otherwise output to console
function logMessage (message) {
  if (!process.send) {
    console.log(message)
  } else {
    process.send(message)
  }
}

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
      options: require('./swagger')
    },
    {
      register: require('@nearform/udaru-hapi-16-plugin'),
      options: {config}
    }
  ],
  function (err) {
    if (err) {
      throw err
    }
  }
)

server.start((err) => {
  if (err) {
    logMessage(`Failed to start server: ${err.message}`)
    process.exit(1)
  }
  logMessage('Server started on: ' + server.info.uri.toLowerCase())
})

module.exports = server
