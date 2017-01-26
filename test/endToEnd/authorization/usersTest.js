
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const userOps = require('../../../src/lib/ops/userOps')
const server = require('./../../../src/wiring-hapi')
const Factory = require('../../factory')
const BuildFor = require('./testBuilder')

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
      })

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
      })

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
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users',
          payload: userData,
          headers: { authorization: '{{caller.id}}' }
        })

      lab.afterEach((done) => {
        userOps.deleteUser({ id: calledId, organizationId }, () => {
          // this is needed to ignore the error (i.e. in case the user wasn't properly created)
          done()
        })
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
      })

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
      })

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
      })

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
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
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
      })

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
      })

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
      })

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
  })
})
