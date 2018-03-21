const Lab = require('lab')
const lab = exports.lab = Lab.script()

const server = require('..')
const Factory = require('udaru-test/factory')
const { BuildFor, udaru } =
  require('@nearform/udaru-hapi-plugin/test/authorization/testBuilder')

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
  lab.experiment('authorization', () => {
    lab.experiment('GET /authorization/access/{userId}/{action}/{resource*}', () => {
      const records = Factory(lab, {
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
          method: 'GET',
          url: '/authorization/access/Modifyid/action_a/resource_a',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize user with correct policy')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:authn:access'],
          Resource: ['authorization/access']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize user with incorrect policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:authn:dummy'],
          Resource: ['authorization/access']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize user with incorrect policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:authn:access'],
          Resource: ['authorization/dummy']
        }])
        .shouldRespond(403)
    })
  })
})
