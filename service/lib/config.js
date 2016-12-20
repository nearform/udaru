const Reconfig = require('reconfig')
const AuthConfig = require('./config.auth')

const Action = AuthConfig.Action
const resources = AuthConfig.resources

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
      defaultPolicies: {
        orgAdmin: {
          version: '1',
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
        }
      }
    },
    teams: {
      defaultPolicies: {
        teamAdmin: {
          version: '1',
          name: 'Default Team Admin for :teamId',
          org_id: ':organizationId',
          statements: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  Action.ReadTeam,
                  Action.UpdateTeam
                ],
                Resource: [
                  resources.teams({ organizationId: ':organizationId', teamId: ':teamId' })
                ]
              },
              {
                Effect: 'Allow',
                Action: [
                  Action.User
                ],
                Resource: [
                  resources.users({ organizationId: ':organizationId', teamId: ':teamId' })
                ]
              }
            ]
          }
        }
      }
    }
  }
}, { envPrefix: 'LABS_AUTH_SERVICE' })
