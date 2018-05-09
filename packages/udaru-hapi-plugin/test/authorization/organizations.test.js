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
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

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
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

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
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        policies: {
          testedPolicy: Policy()
        }
      }, udaru)

      lab.afterEach(async () => {
        try {
          await Promise.all([
            udaru.organizations.delete('OTHERORG'),
            udaru.organizations.delete('OTHER-ORG')
          ])
        } catch (e) {
          // This is needed to ignore the error (i.e. in case the organization wasn't properly created)
        }
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
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        policies: {
          testedPolicy: Policy()
        },
        organizations: {
          testedOrg: { id: 'OTHERORG', name: 'other org', description: 'other org' }
        }
      }, udaru)

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
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        policies: {
          testedPolicy: Policy()
        },
        organizations: {
          testedOrg: { id: 'OTHERORG', name: 'other org', description: 'other org' }
        }
      }, udaru)

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
      const otherOrgId = 'OTHERORGID'
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        organizations: {
          testedOrg: { id: otherOrgId, name: 'other org', description: 'other org' }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            id: 'policyToAdd',
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
          url: `/authorization/organizations/${organizationId}/policies`,
          payload: { policies: [{id: 'policyToAdd'}] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:amend'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller with policy that has different organization scope')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:amend'],
          Resource: [`/authorization/organizations/${otherOrgId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with policy for organization wildcard')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:amend'],
          Resource: [`/authorization/organization/${organizationId}/*`]
        }])
        .shouldRespond(403)

      endpoint.test('should authorize caller with policy for all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:amend'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all organization actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:*'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:amend'],
          Resource: [`/authorization/organization/${organizationId}/*/dummy`]
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST organization policies', () => {
      const otherOrgId = 'OTHERORGID'
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        organizations: {
          testedOrg: { id: otherOrgId, name: 'other org', description: 'other org' }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            id: 'policyToAdd',
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
          url: `/authorization/organizations/${organizationId}/policies`,
          payload: { policies: [{id: 'policyToAdd'}] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:replace'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller with policy that has different organization scope')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:replace'],
          Resource: [`/authorization/organizations/${otherOrgId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with policy for organization wildcard')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:replace'],
          Resource: [`/authorization/organization/${organizationId}/*`]
        }])
        .shouldRespond(403)

      endpoint.test('should authorize caller with policy for all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:replace'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all organization actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:*'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:replace'],
          Resource: [`/authorization/organization/${organizationId}/*/dummy`]
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE organization policies', () => {
      const otherOrgId = 'OTHERORGID'
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
        },
        organizations: {
          testedOrg: { id: otherOrgId, name: 'other org', description: 'other org', policies: [{id: 'policyToAdd'}] }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId: otherOrgId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: `/authorization/organizations/${organizationId}/policies`,
          payload: { },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller with policy that has different organization scope')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organizations/${otherOrgId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with policy for organization wildcard')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${organizationId}/*`]
        }])
        .shouldRespond(403)

      endpoint.test('should authorize caller with policy for all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all organization actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:*'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: [`/authorization/organization/${organizationId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${organizationId}/*/dummy`]
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE organization policy', () => {
      const otherOrgId = 'OTHERORGID'
      const policyId = 'policyToAdd'
      const records = Factory(lab, {
        users: {
          caller: { name: 'caller', organizationId: otherOrgId, policies: [{id: 'testedPolicy'}] }
        },
        organizations: {
          testedOrg: { id: otherOrgId, name: 'other org', description: 'other org', policies: [{id: 'policyToAdd'}] }
        },
        policies: {
          testedPolicy: {
            id: policyId + '2',
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId: otherOrgId
          },
          policyToAdd: {
            id: policyId,
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: {
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            },
            organizationId: otherOrgId
          }
        }
      }, udaru)

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: `/authorization/organizations/${otherOrgId}/policies/${policyId}`,
          payload: { },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${otherOrgId}`]
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller with policy that has different organization scope')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organizations/${organizationId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with policy for organization wildcard')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${otherOrgId}/*`]
        }])
        .shouldRespond(403)

      endpoint.test('should authorize caller with policy for all organizations')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: ['/authorization/organization/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all organization actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:*'],
          Resource: [`/authorization/organization/${otherOrgId}`]
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:dummy'],
          Resource: [`/authorization/organization/${otherOrgId}`]
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:organizations:policy:remove'],
          Resource: [`/authorization/organization/${otherOrgId}/*/dummy`]
        }])
        .shouldRespond(403)
    })
  })
})
