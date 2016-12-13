'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('./../../utils')

var userOps = {}
var usersRoutes = proxyquire('./../../../routes/public/users', { './../../lib/userOps': () => userOps })
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

    userOps.readUserById = function (params, cb) {
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
    userOps.readUserById = function (params, cb) {
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
        organization_id: 'OILCOUSA'
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
    userOps.deleteUserById = function (params, cb) {
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
    userOps.deleteUserById = function (params, cb) {
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
    userOps.updateUser = function (id, params, cb) {
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
        teams: [],
        policies: []
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
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/1',
      payload: {
        name: 'Joe',
        teams: [],
        policies: []
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
