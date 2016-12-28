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
  lab.test('check authorization should return access true for allowed', (done) => {
    authorizeMock.isUserAuthorized = (params, cb) => {
      process.nextTick(() => {
        cb(null, {access: true})
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/1/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })

  lab.test('check authorization should return access false for denied', (done) => {
    authorizeMock.isUserAuthorized = (params, cb) => {
      process.nextTick(() => {
        cb(null, {access: false})
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/1/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

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

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionListStub = {
      actions: [
        'action a',
        'action b'
      ]
    }

    authorizeMock.listAuthorizations = (params, cb) => {
      process.nextTick(() => {
        cb(null, actionListStub)
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/1/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

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

  lab.test('list authorizations should return actions allowed for the user when using an URI', (done) => {
    const actionListStub = {
      actions: [
        'action a',
        'action b'
      ]
    }

    authorizeMock.listAuthorizations = (params, cb) => {
      process.nextTick(() => {
        cb(null, actionListStub)
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/1/my/resource/uri'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

      done()
    })
  })

  lab.test('check authorization should return access true for allowed on URI resource', (done) => {
    authorizeMock.isUserAuthorized = (params, cb) => {
      expect(params.userId).to.equal(1)
      expect(params.action).to.equal('action_a')
      expect(params.resource).to.equal('/my/resource/uri')

      process.nextTick(() => {
        cb(null, {access: true})
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/1/action_a//my/resource/uri'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })
})
