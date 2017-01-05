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
    superUser: {
      organization: {
        id: 'ROOT',
        name: 'SuperOrganization',
        description: 'SuperUser Organization'
      },
      name: 'SuperUser',
      token: 'SuperUserToken',
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
    },
    organizations: {
      defaultPolicies: {
        orgAdmin: {
          version: '1',
          name: ':organizationId admin',
          org_id: ':organizationId',
          statements: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [Action.ReadOrganization],
                Resource: [resources.organizations({ organizationId: ':organizationId' })]
              },
              {
                Effect: 'Allow',
                Action: [Action.AllTeam],
                Resource: [resources.teams({ organizationId: ':organizationId' })]
              },
              {
                Effect: 'Allow',
                Action: [Action.AllUser],
                Resource: [resources.users({ organizationId: ':organizationId' })]
              },
              {
                Effect: 'Allow',
                Action: [Action.ListPolicies],
                Resource: [resources.policies({ organizationId: ':organizationId' })]
              },
              {
                Effect: 'Allow',
                Action: [Action.ReadPolicy],
                Resource: [resources.policies({ organizationId: ':organizationId' })]
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
                  Action.AllUser
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
