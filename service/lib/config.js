const Reconfig = require('reconfig')

module.exports = new Reconfig({
  pgdb: {
    user: 'postgres',
    database: 'authorization',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
  },
  hapi: {
    port: 8080,
    host: 'localhost'
  },
  logger: {
    pino: {
      level: 'info'
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
    organizations: {
      defaultPolicies: [
        {
          version: '0.1',
          name: ':organizationId admin',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:organization:read'],
                'Resource': [':organizationId:/authorization/organizations/*']
              },
              {
                'Effect': 'Allow',
                'Action': ['authorization:users:*'],
                'Resource': [':organizationId:/authorization/users*']
              },
              {
                'Effect': 'Allow',
                'Action': ['authorization:teams:*'],
                'Resource': [':organizationId:/authorization/teams*']
              },
              {
                'Effect': 'Allow',
                'Action': ['authorization:policies:list'],
                'Resource': [':organizationId:/authorization/policies']
              },
              {
                'Effect': 'Allow',
                'Action': ['authorization:policy:read'],
                'Resource': [':organizationId:/authorization/policies/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:organization:read',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:organization:read'],
                'Resource': [':organizationId:/authorization/organizations/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:team:create',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:team:create'],
                'Resource': [':organizationId:/authorization/teams']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:team:read',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:team:read'],
                'Resource': [':organizationId:/authorization/teams/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:team:update',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:team:update'],
                'Resource': [':organizationId:/authorization/teams/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:team:delete',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:team:delete'],
                'Resource': [':organizationId:/authorization/teams/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:teams:list',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:team:list'],
                'Resource': [':organizationId:/authorization/teams']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:user:create',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:user:create'],
                'Resource': [':organizationId:/authorization/users']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:user:read',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:user:read'],
                'Resource': [':organizationId:/authorization/users/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:user:update',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:user:update'],
                'Resource': [':organizationId:/authorization/users/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:user:delete',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:user:delete'],
                'Resource': [':organizationId:/authorization/users/*']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:users:list',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:users:list'],
                'Resource': [':organizationId:/authorization/users']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:policies:list',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:policies:list'],
                'Resource': [':organizationId:/authorization/policies']
              }
            ]
          }
        },
        {
          version: '0.1',
          name: ':organizationId authorization:policy:read',
          org_id: ':organizationId',
          statements: {
            'Statement': [
              {
                'Effect': 'Allow',
                'Action': ['authorization:policy:read'],
                'Resource': [':organizationId:/authorization/policies/*']
              }
            ]
          }
        }
      ]
    }
  }
}, { envPrefix: 'LABS_AUTH_SERVICE' })
