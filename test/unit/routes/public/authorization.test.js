'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
// var proxyquire = require('proxyquire')
var utils = require('../../../utils')

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
const server = {} // proxyquire('./../../../lib/plugin/server', { './../core': udaruF })

lab.experiment('Authorization', () => {
  lab.test.skip('check authorization should return 500 for error case', (done) => {
    udaru.authorize = {
      isUserAuthorized: (params, cb) => {
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/1/action_a/1/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result
      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test.skip('list authorizations should return 500 for error case', (done) => {
    udaru.authorize = {
      listActions: (params, cb) => {
        process.nextTick(() => {
          cb(Boom.badImplementation())
        })
      }
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/1/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
