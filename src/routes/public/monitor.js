'use strict'

exports.register = function (server, options, next) {

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
      tags: ['api', 'service', 'ping', 'monitor']
    }
  })

  next()
}

exports.register.attributes = {
  name: 'monitor',
  version: '0.0.1'
}
