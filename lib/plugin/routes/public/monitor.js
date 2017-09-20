'use strict'

function buildMonitor (/* udaru, config */) {
  function register (server, options, next) {
    server.route({
      method: 'GET',
      path: '/ping',
      handler: function (request, reply) {
        reply()
      },
      config: {
        auth: false,
        description: 'Ping endpoint',
        notes: 'The GET /ping endpoint will return 200 if the server is up and running.',
        tags: ['api', 'monitoring']
      }
    })

    next()
  }

  register.attributes = {
    name: 'monitor',
    version: '0.0.1'
  }

  return register
}

module.exports = buildMonitor
