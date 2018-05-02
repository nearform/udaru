'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('@nearform/udaru-core/test/testUtils')
const udaru = require('@nearform/udaru-core')()
const serverFactory = require('../test-server')

const statements = { Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] }
const policyCreateData = {
  version: '2016-07-01',
  name: 'Super Admin',
  statements,
  organizationId: 'WONKA'
}

lab.experiment('get users SQL injection tests', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('initial reference team list control test', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(3)
    expect(result.total).to.equal(7)
    expect(result.data.length).to.equal(3)
  })

  lab.test('Try to inject the limit from paging', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3%20OR%201=1&page=1'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Try to inject the limit from paging with offset commenting', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3%20OR%201=1%3B--%20-&page=1'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Try to inject the page from paging functionality', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1%20OR%201'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Try to inject the org id', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })
    options.headers.org = '\'WONKA\' OR 1=1'

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(400)
  })

  lab.test('Try to use a long org name', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })

    let org = 'abcdefghijk'
    for (var i = 0; i < 10; i++) {
      org += org
    }
    options.headers.org = org

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('inject admin policy to a user through authorization field', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = {
      headers: {
        authorization: '\'ManyPoliciesId\' OR 1=1',
        org: 'WONKA'
      },
      method: 'PUT',
      url: '/authorization/users/ManyPoliciesId/policies',
      payload: {
        policies: [p.id]
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(401)

    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('inject org from the adding admin policy to a user endpoint', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = {
      headers: {
        authorization: 'ManyPoliciesId',
        org: '\'WONKA\' OR 1=1'
      },
      method: 'PUT',
      url: '/authorization/users/ManyPoliciesId/policies',
      payload: {
        policies: [p.id]
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(403)

    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('inject the url from the adding admin policy to a user endpoint', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = {
      headers: {
        authorization: 'ManyPoliciesId',
        org: 'WONKA'
      },
      method: 'PUT',
      url: '/authorization/users/x/policies',
      payload: {
        policies: [p.id]
      }
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(403)

    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('control test - check authorization should return access false for denied', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({ access: false })
  })

  lab.test('Test inject header authorization field access route', async () => {
    const options = {
      headers: {
        authorization: '\'ManyPoliciesId\' OR 1=1',
        org: 'WONKA'
      },
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(401)
  })

  lab.test('Test inject header org field authorization access', async () => {
    const options = {
      headers: {
        authorization: 'ManyPoliciesId',
        org: '\'WONKA\' or 1=1'
      },
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(403)
  })
})
