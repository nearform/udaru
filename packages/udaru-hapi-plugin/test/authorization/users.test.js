
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../test-server')
const Factory = require('@nearform/udaru-core/test/factory')
const { BuildFor, udaru } = require('../testBuilder')

const organizationId = 'WONKA'
function Policy (Statement) {
  return {
    version: '2016-07-01',
    name: 'Test Policy',
    statements: {
      Statement: Statement || [{
        Effect: 'Allow',
        Action: ['dummy'],
        Resource: ['dummy']
      }]
    },
    organizationId
  }
}

lab.experiment('Routes Authorizations', () => {
  lab.experiment('users', () => {
    lab.experiment('GET /users/:id', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/users/{{called.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('GET /users', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/users',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy to list users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with authorization on a single team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST', () => {
      const calledId = 'fake-user'
      const userData = {
        id: calledId,
        name: 'Fake User'
      }

      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users',
          payload: userData,
          headers: { authorization: '{{caller.id}}' }
        })

      lab.afterEach(async () => {
        try {
          await udaru.users.delete({id: calledId, organizationId})
        } catch (e) {
          // This is needed to ignore the error (i.e. in case the user wasn't properly created)
        }
      })

      endpoint.test('should authorize caller with policy create users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(201)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with authorization on a team (create user on team doesn\'t make sense)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT', () => {
      const userData = {
        name: 'called user'
      }

      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/users/{{called.id}}',
          payload: userData,
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT user policies', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            id: 'policy-to-add',
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/users/{{called.id}}/policies',
          payload: { policies: ['policy-to-add'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:amend'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:amend'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:amend'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST user policies', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            id: 'policy-to-add',
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users/{{called.id}}/policies',
          payload: { policies: ['policy-to-add'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE user policies', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId, policies: ['policyToDelete'] }
        },
        policies: {
          testedPolicy: Policy(),
          policyToDelete: {
            id: 'policy-to-delete',
            version: '2016-07-01',
            name: 'Policy To Delete',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}/policies',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE single user policy', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId, policies: ['policyToDelete'] }
        },
        policies: {
          testedPolicy: Policy(),
          policyToDelete: {
            id: 'policy-to-delete',
            version: '2016-07-01',
            name: 'Policy To Delete',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}/policies/policy-to-add',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST user teams', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam1: { name: 'called team 1', description: 'desc', organizationId, users: ['called'] },
          calledTeam2: { name: 'called team 2', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users/{{called.id}}/teams',
          payload: { teams: ['{{calledTeam1.id}}', '{{calledTeam2.id}}'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for all users in both teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:replace'],
          Resource: [
            '/authorization/user/WONKA/{{calledTeam1.id}}/*',
            '/authorization/user/WONKA/{{calledTeam2.id}}/*'
          ]
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:replace'],
          Resource: ['/authorization/user/WONKA/*/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:*'],
          Resource: ['/authorization/user/WONKA/*/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy on one of the teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:replace'],
          Resource: ['/authorization/user/WONKA/{{calledTeam1.id}}/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with policy only on the specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:replace'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE user teams', () => {
      const records = Factory(lab, {
        teams: {
          calledTeam1: { name: 'called team 1', description: 'desc', organizationId, users: ['called'] },
          calledTeam2: { name: 'called team 2', description: 'desc', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}/teams',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for all users in both teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:remove'],
          Resource: [
            '/authorization/user/WONKA/{{calledTeam1.id}}/*',
            '/authorization/user/WONKA/{{calledTeam2.id}}/*'
          ]
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:remove'],
          Resource: ['/authorization/user/WONKA/*/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:*'],
          Resource: ['/authorization/user/WONKA/*/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy on one of the teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:remove'],
          Resource: ['/authorization/user/WONKA/{{calledTeam1.id}}/*']
        }])
        .shouldRespond(403)

      endpoint.test('should anot uthorize caller with policy only on the specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:teams:remove'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(403)
    })
  })
})
