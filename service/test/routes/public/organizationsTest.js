'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
var proxyquire = require('proxyquire')

var organizationOps = {}
var organizationsRoutes = proxyquire('./../../../routes/public/organizations', { './../../lib/organizationOps': () => organizationOps })
var server = proxyquire('./../../../wiring-hapi', { './routes/public/organizations': organizationsRoutes })

lab.experiment('Organizations', () => {
  lab.test('get organizations list', (done) => {
    var expected = [{
      id: 'WONKA',
      name: 'WONKA',
      description: 'WONKA organization'
    }, {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm organization'
    }]

    organizationOps.list = function (params, cb) {
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/organizations'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('get single organization', (done) => {
    let expected = {
      id: 'WONKA',
      name: 'WONKA',
      description: 'WONKA organization'
    }

    organizationOps.readById = function (params, cb) {
      process.nextTick(() => {
        cb(null, expected)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/organizations/WONKA'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('create organization should return 201 for success', (done) => {
    const organization = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm org'
    }

    organizationOps.create = function (params, cb) {
      process.nextTick(() => {
        cb(null, organization)
      })
    }

    const options = {
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(organization)

      done()
    })
  })

  lab.test('delete organization should return 204 if success', (done) => {
    organizationOps.deleteById = function (params, cb) {
      process.nextTick(() => {
        cb()
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/organizations/WONKA'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update organization should return 200 for success', (done) => {
    let orgUpdate = {
      id: 'WONKA',
      name: 'WONKA',
      description: 'WONKA new desc'
    }

    organizationOps.update = function (params, cb) {
      process.nextTick(() => {
        cb(null, orgUpdate)
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/organizations/WONKA',
      payload: {
        name: orgUpdate.name,
        description: orgUpdate.description
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(orgUpdate)

      done()
    })
  })
})
