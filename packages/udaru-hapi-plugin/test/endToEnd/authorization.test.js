'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('udaru-test/utils')
const server = require('../test-server')
const Factory = require('udaru-test/factory')
const udaru = require('udaru')()

lab.experiment('Authorization', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTid/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })

  lab.test('check authorization should return access false for denied', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionList = {
      actions: []
    }
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/ModifyId/not/my/resource'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionList)

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionList = {
      actions: ['Read']
    }
    const options = utils.requestOptions({
      method: 'GET',
      // TO BE DISCUSSED: We need double slashes "//" if we use a "/" at the beginning of a resource in the policies
      // @see https://github.com/nearform/udaru/issues/198
      url: '/authorization/list/ManyPoliciesId//myapp/users/filippo'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionList)

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
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

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionList)

      done()
    })
  })
})

lab.experiment('Authorization inherited org policies', () => {
  const orgId1 = 'orgId1'
  const orgId2 = 'orgId2'
  const testUserId1 = 'testUserId1'
  const testUserId2 = 'testUserId2'
  const org1PolicyId = 'org1PolicyId'

  Factory(lab, {
    organizations: {
      org1: {
        id: orgId1,
        name: 'Test Organization',
        description: 'Test Organization',
        policies: ['testPolicy1', 'checkAccessPolicy1'],
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
      }
    }
  }, udaru)

  lab.test('User authorized against policies inherited from its own organization', (done) => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId1
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(true)

      done()
    })
  })

  lab.test('User checks authorization for another org user', (done) => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId2
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(false)

      done()
    })
  })

  lab.test('Non-existing user has no access to existing organization policies', (done) => {
    const userId = 'abcd1234'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: testUserId1
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(false)

      done()
    })
  })

  lab.test('Root impersonates org in which checked authorization exists', (done) => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: orgId1
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(true)

      done()
    })
  })

  lab.test('Root impersonates org in which checked authorization exists but provides valid other org data', (done) => {
    const userId = testUserId1
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: orgId2
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(false)

      done()
    })
  })
})
