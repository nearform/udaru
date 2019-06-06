'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../udaru-core/test/testUtils')
const buildServer = require('./test-server')
const server = buildServer()
const Factory = require('../../udaru-core/test/factory')
const sinon = require('sinon')
const { BuildFor, udaru } = require('./authorization/testBuilder')

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
  lab.test('should throw registration errors', (done) => {
    const resolved = require('path').resolve('./routes/public/users.js')

    const register = function (...args) {
      args.pop()(new Error('ERROR'))
    }

    register.attributes = {name: 'users', version: '0.0.1'}
    require.cache[resolved] = {id: resolved, filename: resolved, loaded: true, exports: {register}}

    buildServer({}, err => {
      expect(err).to.exist()
      delete require.cache[resolved]
      done()
    })
  })

  lab.test('single hooks should be run', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTid/action_a/resource_a'
    })

    let called = false

    buildServer({
      hooks: {
        'authorize:isUserAuthorized': function (_u1, _u2, _u3, cb) {
          called = true
          cb()
        }
      }
    }, (_e, server) => {
      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal({ access: true })
        expect(called).to.equal(true)
        done()
      })
    })
  })

  lab.test('multiple hooks should be ran', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTid/action_a/resource_a'
    })

    let called = false

    buildServer({
      hooks: {
        'authorize:isUserAuthorized': [function (_u1, _u2, _u3, cb) {
          called = true
          cb()
        }]
      }
    }, (_e, server) => {
      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal({ access: true })
        expect(called).to.equal(true)
        done()
      })
    })
  })
})

lab.experiment('Authentication server errors', () => {
  const records = Factory(lab, {
    users: {
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
    },
    policies: {
      testedPolicy: Policy()
    }
  }, udaru)

  const anotherServer1 = buildServer()
  sinon.stub(anotherServer1.udaru.users, 'read').yields(new Error('ERROR'))

  let endpoint = BuildFor(lab, records)
    .server(anotherServer1)
    .endpoint({
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a',
      headers: { authorization: '{{caller.id}}' }
    })

  endpoint.test('should not authorize an invalid user in case of user read errors')
    .withPolicy([{
      Effect: 'Allow',
      Action: ['authorization:authn:access'],
      Resource: ['authorization/dummy']
    }])
    .shouldRespond(401)

  const anotherServer2 = buildServer()
  sinon.stub(anotherServer2.udaru.authorize, 'isUserAuthorized').yields(new Error('ERROR'))

  endpoint = BuildFor(lab, records)
    .server(anotherServer2)
    .endpoint({
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a',
      headers: { authorization: '{{caller.id}}' }
    })

  endpoint.test('should not authorize an invalid user in case of authorization errors')
    .withPolicy([{
      Effect: 'Allow',
      Action: ['authorization:authn:access'],
      Resource: ['authorization/dummy']
    }])
    .shouldRespond(403)
})

lab.experiment('invalid routes', () => {
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
    .shouldRespond(401)
})

lab.experiment('invalid team validation resource', () => {
  const records = Factory(lab, {
    users: {
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
    },
    policies: {
      testedPolicy: Policy()
    }
  }, udaru)

  const anotherServer1 = buildServer()

  const stub = sinon.stub(anotherServer1.udaruConfig, 'get')
  stub.onFirstCall().callThrough()
  stub.onSecondCall().returns({'team-resource': () => '*'})
  stub.onThirdCall().returns({})

  const endpoint = BuildFor(lab, records)
    .server(anotherServer1)
    .endpoint({
      method: 'POST',
      url: '/no/team-resource/{{caller.id}}',
      payload: { policies: [{id: 'policy-to-add'}] },
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

lab.experiment('team validation resource authorization errors', () => {
  const records = Factory(lab, {
    users: {
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
    },
    policies: {
      testedPolicy: Policy()
    }
  }, udaru)

  const anotherServer1 = buildServer()

  const stub = sinon.stub(anotherServer1.udaru.authorize, 'isUserAuthorized')
  stub.callThrough()
  stub.onCall(1).yields(new Error('ERROR'))

  const endpoint = BuildFor(lab, records)
    .server(anotherServer1)
    .endpoint({
      method: 'POST',
      url: '/authorization/users/{{caller.id}}/teams',
      payload: { teams: ['t1'] },
      headers: { authorization: '{{caller.id}}' }
    })

  endpoint
    .test('should handle server errors')
    .withPolicy([{
      Effect: 'Allow',
      Action: ['*'],
      Resource: ['*']
    }])
    .shouldRespond(403)
})

lab.experiment('team validation resource user errors', () => {
  const records = Factory(lab, {
    users: {
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
    },
    policies: {
      testedPolicy: Policy()
    }
  }, udaru)

  const anotherServer1 = buildServer()

  const stub = sinon.stub(anotherServer1.udaru.users, 'read')
  stub.callThrough()
  stub.onCall(2).yields(new Error('ERROR'))

  const endpoint = BuildFor(lab, records)
    .server(anotherServer1)
    .endpoint({
      method: 'DELETE',
      url: '/authorization/users/{{caller.id}}/teams',
      headers: { authorization: '{{caller.id}}' }
    })

  endpoint
    .test('should handle server errors')
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
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
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
      caller: { name: 'caller', organizationId, policies: [{id: 'testedPolicy'}] }
    },
    policies: {
      testedPolicy: Policy()
    }
  }, udaru)

  const anotherServer1 = buildServer()

  const stub = sinon.stub(anotherServer1.udaru.users, 'read')
  stub.callThrough()
  stub.onCall(1).yields(new Error('ERROR'))

  let endpoint = BuildFor(lab, records)
    .server(anotherServer1)
    .endpoint({
      method: 'GET',
      url: '/authorization/users/{{caller.id}}',
      headers: { authorization: '{{caller.id}}' }
    })

  endpoint
    .test('should not authorize user for a user resource when some other errors occured')
    .withPolicy([{
      Effect: 'Allow',
      Action: ['authorization:users:read'],
      Resource: ['/authorization/user/WONKA/*']
    }])
    .shouldRespond(401)
})
