'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('./../../utils')

/**
 * Skipped because we should mock the entire udaru structure :/
 *
 * query: _.pick(udaru.users.list.validate, ['page', 'limit'])
 *                               ^
 *   TypeError: Cannot read property 'list' of undefined
 */
// var udaru = {}
// var udaruF = function () {
//   return udaru
// }
// var server = proxyquire('./../../../src/hapi-udaru/wiring-hapi', { './../udaru': udaruF })

lab.experiment('Policies', () => {
  lab.test.skip('get policy list should return error for error case', (done) => {
    udaru.policies = {
      list: (params, cb) => {
        expect(params).to.equal({ organizationId: 'WONKA', limit: 10, page: 1 })
        setImmediate(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies?limit=10&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test.skip('get single policy should return error for error case', (done) => {
    udaru.policies = {
      read: (params, cb) => {
        expect(params).to.equal({ id: '99', organizationId: 'WONKA' })
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies/99'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
