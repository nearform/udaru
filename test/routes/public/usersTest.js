'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
// var proxyquire = require('proxyquire')
var utils = require('./../../utils')

/**
 * Skipped because we should mock the entire udaru structure :/
 *
 * query: _.pick(udaru.users.list.validate, ['page', 'limit'])
 *                               ^
 *   TypeError: Cannot read property 'list' of undefined
 */
var udaru = {}
// var udaruF = function () {
//   return udaru
// }
const server = {} // proxyquire('./../../../lib/hapi-udaru/wiring-hapi', { './../module': udaruF })

lab.experiment('Users', () => {
  lab.test.skip('get user list should return error for error case', (done) => {
    udaru.users = {
      list: function (params, cb) {
        expect(params).to.equal({ organizationId: 'WONKA', limit: 100, page: 1 })
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
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

  lab.test.skip('get single user should return error for error case', (done) => {
    udaru.users = {
      read: function (params, cb) {
        expect(params).to.equal({ id: 'Myid', organizationId: 'WONKA' })
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/Myid'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test.skip('create user should return error for error case', (done) => {
    udaru.users = {
      create: function (params, cb) {
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
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

  lab.test.skip('delete user should return error for error case', (done) => {
    udaru.users = {
      delete: function (params, cb) {
        expect(params).to.equal({ id: 'MyId', organizationId: 'WONKA' })
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/MyId'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test.skip('update user should return error for error case', (done) => {
    udaru.users = {
      update: function (params, cb) {
        expect(params.id).to.equal('MyId')
        expect(params.organizationId).to.equal('WONKA')
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/MyId',
      payload: {
        name: 'Joe'
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
