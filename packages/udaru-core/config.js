
const AuthConfig = require('./auth')
const Action = AuthConfig.Action
const resources = AuthConfig.resources

const Reconfig = require('reconfig')

const defaultConfig = {
  AuthConfig,
  pgdb: {
    user: 'postgres',
    database: 'authorization',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
  },
  logger: {
    pino: {
      level: 'info'
    }
  },
  hooks: {
    propagateErrors: false
  },
  authorization: {
    defaultPageSize: 100,
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
              },
              {
                Effect: 'Allow',
                Action: [Action.ReadPolicyVariables],
                Resource: [resources.policies({ organizationId: ':organizationId' })]
              }
            ]
          }
        }
      }
    },
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
                  Action.UpdateTeam,
                  Action.AddTeamMember,
                  Action.ReplaceTeamMember,
                  Action.RemoveTeamMember
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
}

module.exports = (...amendments) => {
  const reconfig = new Reconfig({}, { envPrefix: 'UDARU_SERVICE' })

  amendments.unshift(defaultConfig)
  amendments.filter((a) => (a)).forEach((amendment) => {
    // support passing a reconfig object
    if (amendment._config) {
      reconfig.set(amendment._config)
    } else {
      reconfig.set(amendment)
    }
  })

  return reconfig
}
