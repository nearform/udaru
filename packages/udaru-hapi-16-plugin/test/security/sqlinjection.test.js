'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../../udaru-core/test/testUtils')
const udaru = require('@nearform/udaru-core')()
const server = require('../test-server')()

const statements = { Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] }
const policyCreateData = {
  version: '2016-07-01',
  name: 'Super Admin',
  statements,
  organizationId: 'WONKA'
}

lab.experiment('get users SQL injection tests', () => {
  lab.test('initial reference team list control test', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(3)
      expect(result.total).to.equal(7)
      expect(result.data.length).to.equal(3)

      done()
    })
  })

  lab.test('Try to inject the limit from paging', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3%20OR%201=1&page=1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('Try to inject the limit from paging with offset commenting', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3%20OR%201=1%3B--%20-&page=1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('Try to inject the page from paging functionality', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1%20OR%201'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('Try to inject the org id', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })
    options.headers.org = '\'WONKA\' OR 1=1'

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(3)
      expect(result.total).to.equal(0)
      expect(result.data.length).to.equal(0)

      done()
    })
  })

  lab.test('Try to use a long org name', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?limit=3&page=1'
    })

    let org = 'abcdefghijk'
    for (var i = 0; i < 10; i++) {
      org += org
    }
    options.headers.org = org

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('inject admin policy to a user through authorization field', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

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

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(401)

        udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('inject org from the adding admin policy to a user endpoint', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

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

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('inject the url from the adding admin policy to a user endpoint', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = {
        headers: {
          authorization: 'ManyPoliciesId',
          org: 'WONKA'
        },
        method: 'PUT',
        url: '/authorization/users/*/policies',
        payload: {
          policies: [p.id]
        }
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('control test - check authorization should return access false for denied', (done) => {
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

  lab.test('Test inject header authorization field access route', (done) => {
    const options = {
      headers: {
        authorization: '\'ManyPoliciesId\' OR 1=1',
        org: 'WONKA'
      },
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    }

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(401)

      done()
    })
  })

  lab.test('Test inject header org field authorization access', (done) => {
    const options = {
      headers: {
        authorization: 'ManyPoliciesId',
        org: '\'WONKA\' or 1=1'
      },
      method: 'GET',
      url: '/authorization/access/Modifyid/action_a/resource_a'
    }

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })
})
