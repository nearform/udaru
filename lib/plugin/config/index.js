'use strict'

const udaru = require('../../core')

udaru.config.set({
  hapi: {
    port: 8080,
    host: 'localhost'
  },
  logger: {
    pino: {
      level: 'warn'
    }
  },
  security: {
    api: {
      servicekeys: {
        private: [
          '123456789'
        ]
      }
    }
  },
  authorization: {
    superUser: {
      organization: {
        id: 'ROOT',
        name: 'SuperOrganization',
        description: 'SuperUser Organization'
      },
      id: 'SuperUserId',
      name: 'SuperUser',
      defaultPolicy: {
        version: '1',
        name: 'SuperUser',
        organizationId: ':organizationId',
        statements: {
          Statement: [{
            Effect: 'Allow',
            Action: ['*'],
            Resource: ['*']
          }]
        }
      }
    }
  }
})

module.exports = udaru.config
