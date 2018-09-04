'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('@nearform/udaru-core/test/testUtils')
const serverFactory = require('../test-server')
const Factory = require('@nearform/udaru-core/test/factory')
const udaru = require('@nearform/udaru-core')()

lab.experiment('Authorization', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('check authorization should return access true for allowed', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTid/action_a/resource_a'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({ access: true })
  })

  lab.test('check authorization should return access false for denied', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({ access: false })
  })

  lab.test('batch check authorization should return access true for allowed actions/resource', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/access/ROOTid',
      payload: {
        resourceBatch: [{
          resource: 'resource_a',
          action: 'action_a'
        }]
      }
    })

    const {statusCode, result} = await server.inject(options)

    expect(statusCode).to.equal(200)
    expect(result).to.equal([{
      resource: 'resource_a',
      action: 'action_a',
      access: true
    }])
  })

  lab.test('batch check authorization should return access false for denied actions/resources', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/access/Modifyid',
      payload: {
        resourceBatch: [{
          resource: 'resource_a',
          action: 'action_a'
        }]
      }
    })

    const {statusCode, result} = await server.inject(options)

    expect(statusCode).to.equal(200)
    expect(result).to.equal([{
      resource: 'resource_a',
      action: 'action_a',
      access: false
    }])
  })

  lab.test('list authorizations should return actions allowed for the user', async () => {
    const actionList = {
      actions: []
    }
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/ModifyId/not/my/resource'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal(actionList)
  })

  lab.test('list authorizations should return actions allowed for the user', async () => {
    const actionList = {
      actions: ['Read']
    }
    const options = utils.requestOptions({
      method: 'GET',
      // TO BE DISCUSSED: We need double slashes "//" if we use a "/" at the beginning of a resource in the policies
      // @see https://github.com/nearform/udaru/issues/198
      url: '/authorization/list/ManyPoliciesId//myapp/users/filippo'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal(actionList)
  })

  lab.test('list authorizations should return actions allowed for the user', async () => {
    const actionList = [
      {
        resource: '/myapp/users/filippo',
        actions: ['Read']
      },
      {
        resource: '/myapp/documents/no_access',
        actions: []
      }
    ]
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/ManyPoliciesId?resources=/myapp/users/filippo&resources=/myapp/documents/no_access'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal(actionList)
  })
})

lab.experiment('Authorization inherited org policies', () => {
  const orgId1 = 'orgId1'
  const orgId2 = 'orgId2'
  const testUserId1 = 'testUserId1'
  const testUserId2 = 'testUserId2'
  const org1PolicyId = 'org1PolicyId'

  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  Factory(lab, {
    organizations: {
      org1: {
        id: orgId1,
        name: 'Test Organization',
        description: 'Test Organization',
        policies: ['testPolicy1', 'checkAccessPolicy1', 'contextTestPolicy', 'conditionTestPolicy', 'denyConditionTestPolicy'],
        users: ['TestUser1']
      },
      org2: {
        id: orgId2,
        name: 'Test Organization',
        description: 'Test Organization',
        policies: ['checkAccessPolicy2'],
        users: ['TestUser2']
      }
    },
    users: {
      TestUser1: {
        id: testUserId1,
        name: 'Test User1',
        organizationId: orgId1
      },
      TestUser2: {
        id: testUserId2,
        name: 'Test User2',
        organizationId: orgId2
      }
    },
    policies: {
      testPolicy1: {
        id: org1PolicyId,
        name: 'org1Policy',
        organizationId: orgId1,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['org:documents']
            }
          ]
        }
      },
      checkAccessPolicy1: {
        name: 'checkaccess',
        organizationId: orgId1,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['authorization:authn:access'],
              Resource: ['authorization/access']
            }
          ]
        }
      },
      checkAccessPolicy2: {
        name: 'checkaccess',
        organizationId: orgId2,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['authorization:authn:access'],
              Resource: ['authorization/access']
            }
          ]
        }
      },
      contextTestPolicy: {
        name: 'contextTestPolicy',
        organizationId: orgId1,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['org:docs:$' + '{udaru:userId}']
            }
          ]
        }
      },
      conditionTestPolicy: {
        name: 'conditionTestPolicy',
        organizationId: orgId1,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['org:docs:$' + '{udaru:organizationId}'],
              Condition: {
                StringEquals: { 'request:source': 'server' },
                IpAddress: { 'request:sourceIp': '127.0.0.1' }
              }
            }
          ]
        }
      },
      denyConditionTestPolicy: {
        name: 'denyConditionTestPolicy',
        organizationId: orgId1,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['write'],
              Resource: ['org:docs:$' + '{udaru:organizationId}'],
              Condition: {
                StringEquals: { 'request:source': 'api' }
              }
            }
          ]
        }
      }
    }
  }, udaru)

  lab.test('User authorized against policies inherited from its own organization', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(true)
  })

  lab.test('batchcheck should return access allowed for the resource action pairs', async () => {
    const resourceBatch = [
      {
        resource: 'org:documents',
        action: 'read'
      },
      {
        resource: 'authorization/access',
        action: 'authorization:authn:access'
      },
      {
        resource: 'invalid_resource',
        action: 'invalid_action'
      }
    ]

    const actionsAllowed = [
      {
        resource: 'org:documents',
        action: 'read',
        access: true
      },
      {
        resource: 'authorization/access',
        action: 'authorization:authn:access',
        access: true
      },
      {
        resource: 'invalid_resource',
        action: 'invalid_action',
        access: false
      }
    ]

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/access/' + testUserId1,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      },
      payload: {
        resourceBatch: resourceBatch
      }
    })

    const {statusCode, result} = await server.inject(options)

    expect(statusCode).to.equal(200)
    expect(result).to.equal(actionsAllowed)
  })

  lab.test('batchcheck empty payload', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/access/' + testUserId1,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      },
      payload: {
        resourceBatch: []
      }
    })

    const {statusCode} = await server.inject(options)
    expect(statusCode).to.equal(400)
  })

  lab.test('batchcheck invalid payload', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/access/' + testUserId1,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      },
      payload: {
        resourceBatch: [ { resource: '', action: '' } ]
      }
    })

    const {statusCode} = await server.inject(options)
    expect(statusCode).to.equal(400)
  })

  lab.test('User checks authorization for another org user', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId2
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(false)
  })

  lab.test('Non-existing user has no access to existing organization policies', async () => {
    const userId = 'abcd1234'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(false)
  })

  lab.test('Root impersonates org in which checked authorization exists', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(true)
  })

  lab.test('User is granted access to resource based on udaru:userId context variable', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:docs:${userId}`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(true)
  })

  lab.test('User is NOT granted access to other users resource based on udaru:userId context variable', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${testUserId1}/read/org:docs:${testUserId2}`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(false)
  })

  lab.test('User is granted access to udaru:organizationId resource based on IP conditions', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:docs:${orgId1}`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(true)
  })

  lab.test('User is denied write access to udaru:organization resourec based on request:source condition', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/write/org:docs:${orgId1}`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(false)
  })

  lab.test('Root impersonates org in which checked authorization exists but provides valid other org data', async () => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: orgId2
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.access).to.equal(false)
  })
})
