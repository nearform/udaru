'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('./../../utils')

var authorizeMock = {}
var authRoutes = proxyquire('./../../../routes/public/authorization', { './../../lib/ops/authorizeOps': authorizeMock })
var server = proxyquire('./../../../wiring-hapi', { './routes/public/authorization': authRoutes })

lab.experiment('Authorization', () => {

  lab.test('check authorization should return 500 for error case', (done) => {
    authorizeMock.isUserAuthorized = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
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

  lab.test('list authorizations should return 500 for error case', (done) => {
    authorizeMock.listAuthorizations = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
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
