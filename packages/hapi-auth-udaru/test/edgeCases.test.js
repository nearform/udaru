const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Hapi = require('hapi')
const expect = require('code').expect
const sinon = require('sinon')

const server = require('./test-server')
const Factory = require('@nearform/udaru-core/test/factory')
const { BuildFor, udaru } = require('./testBuilder')
const config = require('../lib/config')()

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

lab.experiment('Edge cases', () => {
  lab.experiment('configuration', () => {
    lab.test('should expect a valid validation function', async () => {
      const s = Hapi.Server()
      await s.register({plugin: require('../lib/authentication'), options: {config}})

      expect(() => s.auth.strategy('udaru', 'udaru', {validateFunc: 123})).to.throw(Error, 'options.validateFunc must be a valid function')
    })
  })

  lab.experiment('single hook', async () => {
    const records = Factory(lab, {
      users: {
        caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
      },
      policies: {
        testedPolicy: Policy()
      }
    }, udaru)

    let called = false

    const endpoint = BuildFor(lab, records)
      .server(server.bind(null, {
        hooks: {
          'authorize:isUserAuthorized': async function (_u1, _u2, _u3) {
            called = true
          }
        }
      }, config.get('hapi.port') + 1))
      .endpoint({
        method: 'GET',
        url: '/authorization/access/Modifyid/action_a/resource_a',
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint.test('should be run')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(200, () => {
        expect(called).to.equal(true)
      })
  })

  lab.experiment('multiple hooks', async () => {
    const records = Factory(lab, {
      users: {
        caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
      },
      policies: {
        testedPolicy: Policy()
      }
    }, udaru)

    let called = false

    const endpoint = BuildFor(lab, records)
      .server(server.bind(null, {
        hooks: {
          'authorize:isUserAuthorized': [async function (_u1, _u2, _u3) {
            called = true
          }]
        }
      }, config.get('hapi.port') + 2))
      .endpoint({
        method: 'GET',
        url: '/authorization/access/Modifyid/action_a/resource_a',
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint.test('should be run')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(200, () => {
        expect(called).to.equal(true)
      })
  })

  lab.experiment('invalid routes', () => {
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
        url: '/no/plugins',
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint
      .test('should not authorize user for routes defined in a invalid way')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(403)
  })

  lab.experiment('invalid validation resource', () => {
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
        url: '/no/resource',
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint
      .test('should not authorize user for routes without a resource')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(500)
  })

  lab.experiment('invalid team validation resource', () => {
    const records = Factory(lab, {
      users: {
        caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
      },
      policies: {
        testedPolicy: Policy()
      }
    }, udaru)

    let stub
    lab.beforeEach(async () => {
      await endpoint.startServer()

      stub = sinon.stub(endpoint.serverInstance.udaruConfig, 'get')
      stub.onFirstCall().callThrough()
      stub.onSecondCall().returns({'team-resource': () => '*'})
      stub.onThirdCall().returns({})
    })

    lab.afterEach(async () => {
      stub.restore()
    })

    const endpoint = BuildFor(lab, records)
      .server(server)
      .endpoint({
        method: 'POST',
        url: '/no/team-resource/{{caller.id}}',
        payload: { policies: ['policy-to-add'] },
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint
      .test('should not authorize user for routes without a resource')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['*'],
        Resource: ['*']
      }])
      .shouldRespond(500)
  })

  lab.experiment('missing headers', () => {
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
        method: 'POST',
        url: '/authorization/policies',
        headers: { authorization: '' }
      })

    endpoint
      .test('should not authorize without an authorization header')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(401)
  })

  lab.experiment('resource not found', () => {
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
        url: '/authorization/users/invalid',
        headers: { authorization: '{{caller.id}}' }
      })

    endpoint
      .test('should not authorize user for an invalid user resource')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:authn:access'],
        Resource: ['authorization/access']
      }])
      .shouldRespond(403)
  })

  lab.experiment('unhandled errors', () => {
    const records = Factory(lab, {
      users: {
        caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
      },
      policies: {
        testedPolicy: Policy()
      }
    }, udaru)

    let stub
    let endpoint = BuildFor(lab, records)
      .server(server)
      .endpoint({
        method: 'GET',
        url: '/authorization/users/{{caller.id}}',
        headers: { authorization: '{{caller.id}}' }
      })

    lab.beforeEach(async () => {
      await endpoint.startServer()

      stub = sinon.stub(endpoint.serverInstance.udaru.users, 'read')
      stub.callThrough()
      stub.onCall(1).rejects(new Error('ERROR'))
    })

    lab.afterEach(() => {
      stub.restore()
    })

    endpoint
      .test('should not authorize user for a user resource when some other errors occured')
      .withPolicy([{
        Effect: 'Allow',
        Action: ['authorization:users:read'],
        Resource: ['/authorization/user/WONKA/*']
      }])
      .shouldRespond(500)
  })
})
