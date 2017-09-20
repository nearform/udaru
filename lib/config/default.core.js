
const AuthConfig = require('./auth')
const Action = AuthConfig.Action
const resources = AuthConfig.resources

module.exports = {
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
