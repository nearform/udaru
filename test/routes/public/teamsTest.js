'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')
var utils = require('./../../utils')

var teamOps = {}
var teamsRoutes = proxyquire('./../../../src/routes/public/teams', { './../../lib/ops/teamOps': teamOps })
var server = proxyquire('./../../../src/wiring-hapi', { './routes/public/teams': teamsRoutes })

lab.experiment('Teams', () => {

  lab.test('get team list should return error for error case', (done) => {
    teamOps.listOrgTeams = (params, cb) => {
      expect(params).to.equal({ organizationId: 'WONKA', limit: 1, page: 1 })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?page=1&limit=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })


  lab.test('create new team should return error for error case', (done) => {
    teamOps.createTeam = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team C',
        description: 'This is Team C'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update team should return error for error case', (done) => {
    teamOps.updateTeam = (params, cb) => {
      expect(params).to.equal({
        id: '2',
        name: 'Team D',
        description: 'Can Team C become Team D?',
        organizationId: 'WONKA'
      })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
        name: 'Team D',
        description: 'Can Team C become Team D?'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete team should return error for error case', (done) => {
    teamOps.deleteTeam = (params, cb) => {
      expect(params).to.equal({ id: '1', organizationId: 'WONKA' })
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
