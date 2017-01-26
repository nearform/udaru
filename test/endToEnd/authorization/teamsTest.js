const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('../../../src/wiring-hapi')
const teamOps = require('../../../src/lib/ops/teamOps')

const Factory = require('../../factory')
const BuildFor = require('./testBuilder')

const organizationId = 'WONKA'
function Policy (Statement) {
  return {
    version: '2016-07-01',
    name: 'Test Policy',
    statements: JSON.stringify({
      Statement: Statement || [{
        Effect: 'Allow',
        Action: ['dummy'],
        Resource: ['dummy']
      }]
    }),
    organizationId
  }
}

lab.experiment('Routes Authorizations', () => {
  lab.experiment('teams', () => {
    lab.experiment('GET /authorization/teams', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/teams',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:list'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:list'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('GET /authorization/teams/{id}', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/teams/{{calledTeam.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST /authorization/teams', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.afterEach((done) => {
        teamOps.deleteTeam({ id: 'created_team', organizationId }, () => {
          // ignore error
          done()
        })
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/teams',
          payload: {
            id: 'created_team',
            name: 'called team',
            description: 'called team'
          },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:create'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(201)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:create'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT /authorization/teams/{id}', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/teams/{{calledTeam.id}}',
          payload: {
            name: 'updated team',
            description: 'updated team'
          },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:update'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:update'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:update'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE /authorization/teams/{id}', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/teams/{{calledTeam.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:delete'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:delete'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:delete'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT /authorization/teams/{id}/nest', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId },
          parentTeam: { name: 'parent team', description: 'parent team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/teams/{{calledTeam.id}}/nest',
          payload: { parentId: '{{parentTeam.id}}' },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT /authorization/teams/{id}/unnest', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId },
          parentTeam: { name: 'parent team', description: 'parent team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/teams/{{calledTeam.id}}/unnest',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:manage'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT /authorization/teams/{id}/policies', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          addedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/teams/{{calledTeam.id}}/policies',
          payload: { policies: ['{{addedPolicy.id}}'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:add'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:add'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:add'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST /authorization/teams/{id}/policies', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          addedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/teams/{{calledTeam.id}}/policies',
          payload: { policies: ['{{addedPolicy.id}}'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:replace'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:replace'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:replace'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE /authorization/teams/{id}/policies', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/teams/{{calledTeam.id}}/policies',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE /authorization/teams/{id}/policies/{policyId}', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId, policies: ['deletedPolicy'] }
        },
        policies: {
          testedPolicy: Policy(),
          deletedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/teams/{{calledTeam.id}}/policies/{{deletedPolicy.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:policy:remove'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('GET /authorization/teams/{id}/users', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        teams: {
          calledTeam: {
            name: 'called team',
            description: 'called team',
            organizationId,
            users: ['called']
          }
        },
        policies: {
          testedPolicy: Policy(),
          deletedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/teams/{{calledTeam.id}}/users?page=1&limit=1',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:read'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT /authorization/teams/{id}/users', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          member: { name: 'member', organizationId }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/teams/{{calledTeam.id}}/users',
          payload: { users: ['{{member.id}}'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:add'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:add'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:add'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST /authorization/teams/{id}/users', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          member: { name: 'member', organizationId }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          addedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/teams/{{calledTeam.id}}/users',
          payload: { users: ['{{member.id}}'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:replace'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:replace'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:replace'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE /authorization/teams/{id}/users', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          member: { name: 'member', organizationId }
        },
        teams: {
          calledTeam: { name: 'called team', description: 'called team', organizationId, users: ['member'] }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/teams/{{calledTeam.id}}/users',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE /authorization/teams/{id}/users/{userId}', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          member: { name: 'member', organizationId }
        },
        teams: {
          calledTeam: {
            name: 'called team',
            description: 'called team',
            organizationId,
            users: ['member']
          }
        },
        policies: {
          testedPolicy: Policy(),
          deletedPolicy: Policy()
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/teams/{{calledTeam.id}}/users/{{member.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with policy for all teams')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with policy for specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:dummy'],
          Resource: ['/authorization/team/WONKA/{{calledTeam.id}}']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:teams:user:remove'],
          Resource: ['/authorization/team/WONKA/dummy']
        }])
        .shouldRespond(403)
    })
  })
})
