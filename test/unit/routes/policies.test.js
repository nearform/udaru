'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('../../utils')

var udaru = {}
var policiesRoutes = proxyquire('../../../lib/server/routes/public/policies', { '../../../module': udaru })
var server = proxyquire('../../../lib/server', { './routes/public/policies': policiesRoutes })

lab.experiment('Policies', () => {
  lab.test('get policy list should return error for error case', (done) => {
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

  lab.test('get single policy should return error for error case', (done) => {
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
