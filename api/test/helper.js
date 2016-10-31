var Hapi = require('hapi')

const API_HOST = process.env.API_HOST || 'localhost'
const API_PORT = process.env.API_PORT || 8000

var createTestServer = function (plugin, pluginOptions, done) {
  const registerOptions = {
    register: plugin,
    options: pluginOptions
  }

  var server = new Hapi.Server({ debug: false })

  server.connection({
    host: API_HOST,
    port: API_PORT
  })

  server.register(registerOptions, done)

  return server
}

module.exports = {
  createTestServer: createTestServer
}
