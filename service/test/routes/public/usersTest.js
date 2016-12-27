'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('./../../utils')

var userOps = {}
var usersRoutes = proxyquire('./../../../routes/public/users', { './../../lib/userOps': userOps })
var server = proxyquire('./../../../wiring-hapi', { './routes/public/users': usersRoutes })

lab.experiment('Users', () => {

  lab.test('get user list', (done) => {
    var expected = [{
      id: 1,
      name: 'John'
    }, {
      id: 2,
      name: 'Jack'
    }]

    userOps.listOrgUsers = function (params, cb) {
      expect(params).to.equal({ organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('get user list should return error for error case', (done) => {
    userOps.listOrgUsers = function (params, cb) {
      expect(params).to.equal({ organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single user', (done) => {
    let expected = {
      id: 1,
      name: 'John',
      policies: [],
      team: []
    }

    userOps.readUser = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('get single user should return error for error case', (done) => {
    userOps.readUser = function (params, cb) {
      expect(params).to.equal({ id: 99, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/99'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('create user for a specific organization being a SuperUser should return 201 for success', (done) => {
    const newUserStub = {
      id: 2,
      name: 'Salman',
      policies: [],
      team: []
    }

    userOps.createUser = function (params, cb) {
      expect(params).to.equal({ name: 'Salman', organizationId: 'OILCOUSA' })
      process.nextTick(() => {
        cb(null, newUserStub)
      })
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      },
      headers: {
        authorization: 1,
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(newUserStub)

      done()
    })
  })

  lab.test('create user should return 201 for success', (done) => {
    const newUserStub = {
      id: 2,
      name: 'Salman',
      policies: [],
      team: []
    }

    userOps.createUser = function (params, cb) {
      expect(params).to.equal({ name: 'Salman', organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(null, newUserStub)
      })
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(newUserStub)

      done()
    })
  })

  lab.test('create user should return 400 bad request if input validation fails', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {}
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.include({
        statusCode: 400,
        error: 'Bad Request'
      })

      done()
    })
  })

  lab.test('create user should return error for error case', (done) => {
    userOps.createUser = function (params, cb) {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return 204 if success', (done) => {
    userOps.deleteUser = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb()
      })
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return error for error case', (done) => {
    userOps.deleteUser = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update user should return 200 for success', (done) => {
    userOps.updateUser = function (params, cb) {
      expect(params.id).to.equal(3)
      expect(params.organizationId).to.equal('WONKA')
      process.nextTick(() => {
        cb(null, {
          id: 3,
          name: 'Joe'
        })
      })
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/3',
      payload: {
        name: 'Joe',
        teams: []
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 3,
        name: 'Joe'
      })

      done()
    })
  })

  lab.test('update user should return error for error case', (done) => {
    userOps.updateUser = function (params, cb) {
      expect(params.id).to.equal(1)
      expect(params.organizationId).to.equal('WONKA')
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/1',
      payload: {
        name: 'Joe',
        teams: []
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('add policies to a user', (done) => {
    let expected = {
      id: 1,
      name: 'John',
      policies: [{ id: 1, name: 'new policy' }],
      team: []
    }

    userOps.addUserPolicies = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA', policies: [ { id: 1 } ] })
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/1/policies',
      payload: {
        policies: [{ id: 1 }]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('clear and replace policies for a user', (done) => {
    let expected = {
      id: 1,
      name: 'John',
      policies: [],
      team: []
    }

    userOps.replaceUserPolicies = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA', policies: [ { id: 1 } ] })
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/1/policies',
      payload: {
        policies: [{ id: 1 }]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('remove all user\'s policies', (done) => {
    userOps.deleteUserPolicies = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(null)
      })
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/1/policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      done()
    })
  })

  lab.test('remove one user\'s policies', (done) => {
    userOps.deleteUserPolicy = function (params, cb) {
      expect(params).to.equal({ userId: 33, policyId: 99, organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(null)
      })
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/33/policies/99'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      done()
    })
  })

  lab.test('List all user actions and resources', (done) => {
    userOps.listActionsByResource = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA', resources: [] })
      process.nextTick(() => {
        cb(null, [])
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/1/actions'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal([])

      done()
    })
  })

  lab.test('List all user actions and resources filtered by resources', (done) => {
    userOps.listActionsByResource = function (params, cb) {
      expect(params).to.equal({ id: 1, organizationId: 'WONKA', resources: ['a/b/c', 'a/d/f', 'a:re:fff'] })
      process.nextTick(() => {
        cb(null, [])
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/1/actions?resources=a/b/c,a/d/f,a:re:fff'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal([])

      done()
    })
  })
})
