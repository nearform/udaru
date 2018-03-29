'use strict'

module.exports = {
  name: 'monitor',
  version: '0.0.1',
  register (server, options) {
    server.route({
      method: 'GET',
      path: '/ping',
      async handler (request, h) {
        return h.response()
      },
      config: {
        auth: false,
        description: 'Ping endpoint',
        notes: 'The GET /ping endpoint will return 200 if the server is up and running.',
        tags: ['api', 'monitoring']
      }
    })
  }
}
