const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('./../../../lib/server')
const Factory = require('../../factory')
const BuildFor = require('./testBuilder')
const utils = require('../../utils')
const { udaru } = utils

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
  lab.experiment('organizations', () => {
    lab.experiment('GET ', () => {
      const records = Factory(lab, {
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
          method: 'GET',
          url: '/authorization/organizations',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:list'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: ['*']
        }])
        .shouldRespond(403)
    })

    lab.experiment('GET /authorization/organizations/{id}', () => {
      const records = Factory(lab, {
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
          method: 'GET',
          url: '/authorization/organizations/WONKA',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy on specific organization')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:read'],
          Resource: ['/authorization/organization/WONKA']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with correct policy on all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:read'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: ['/authorization/organization/WONKA']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:read'],
          Resource: ['/authorization/organization/OTHER-ORG']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.afterEach((done) => {
        udaru.organizations.delete('OTHERORG', () => {
          // this is needed to ignore the error (i.e. in case the policy wasn't properly created)
          done()
        })
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/organizations',
          payload: {
            id: 'OTHERORG',
            name: 'other org',
            description: 'other org'
          },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:create'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(201)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: ['*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:create'],
          Resource: ['/authorization/organization/OTHER-ORG']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        },
        organizations: {
          testedOrg: { id: 'OTHERORG', name: 'other org', description: 'other org' }
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/organizations/{{testedOrg.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy on specific organization')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:delete'],
          Resource: ['/authorization/organization/OTHERORG']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize user with correct policy on all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:delete'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: ['/authorization/organization/OTHERORG']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:delete'],
          Resource: ['/authorization/organization/YET-ANOTHER-ORG']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT', () => {
      const records = Factory(lab, {

        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        },
        organizations: {
          testedOrg: { id: 'OTHERORG', name: 'other org', description: 'other org' }
        }
      })

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/organizations/OTHERORG',
          payload: { name: 'new name', description: 'new description' },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy on specific organization')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:update'],
          Resource: ['/authorization/organization/OTHERORG']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize user with correct policy on all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:update'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: ['/authorization/organization/OTHERORG']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:update'],
          Resource: ['/authorization/organization/YET-ANOTHER-ORG']
        }])
        .shouldRespond(403)
    })

    lab.experiment('PUT organization policies', () => {
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        organizations: {
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
          url: '/authorization/organizations/WONKA/policies',
          payload: { policies: ['policy-to-add'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:add'],
          Resource: ['/authorization/organization/WONKA']
        }])
        .shouldRespond(200)
    })
  })
})
