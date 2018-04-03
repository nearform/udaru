const config = require('../config')()
const Hapi = require('hapi')
const UdaruPlugin = require('..')

const server = module.exports = new Hapi.Server()

server.connection({
  port: Number(config.get('hapi.port')),
  host: config.get('hapi.host'),
  routes: {
    cors: {
      additionalHeaders: ['org']
    }
  }
})

server.register({
  register: UdaruPlugin,
  options: {config}
}, function (err) {
  if (err) {
    throw err
  }
})
