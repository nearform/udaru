'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../utils')
const server = require('../../../lib/server')
const Factory = require('../../factory')

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
  const newOrgPolicyId = 'newOrgPolicyId'
  const newOrgId = 'newOrgId'
  const testUserId = 'testUserId'

  Factory(lab, {
    organizations: {
      org1: {
        id: newOrgId,
        name: 'Test Organization',
        description: 'Test Organization',
        policies: ['testPolicy'],
        users: ['TestUser']
      }
    },
    users: {
      TestUser: {
        id: testUserId,
        name: 'Test User',
        organizationId: newOrgId
      }
    },
    policies: {
      testPolicy: {
        id: newOrgPolicyId,
        name: 'newOrgPolicyId',
        organizationId: newOrgId,
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['org:documents']
            }
          ]
        }
      }
    }
  })

  lab.test('User authorized against policies inherited from organization', (done) => {
    const userId = testUserId
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: newOrgId
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.access).to.equal(true)

      done()
    })
  })

  lab.test('Non-existing user has no access to existing organization policies', (done) => {
    const userId = 'abcd1234'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/access/${userId}/read/org:documents`,
      headers: {
        authorization: 'ROOTid',
        org: newOrgId
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
