'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const Boom = require('boom')
var proxyquire = require('proxyquire')

var teamOps = {}
var teamsRoutes = proxyquire('./../../../routes/public/teams', { './../../lib/teamOps': () => teamOps })
var server = proxyquire('./../../../wiring-hapi', { './routes/public/teams': teamsRoutes })

lab.experiment('Teams', () => {
  lab.test('get team list', (done) => {
    const teamListStub = [{
      id: 1,
      name: 'Team A'
    }, {
      id: 2,
      name: 'Team B'
    }]

    teamOps.listAllTeams = (params, cb) => {
      process.nextTick(() => {
        cb(null, teamListStub)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/teams'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(teamListStub)

      done()
    })
  })

  lab.test('get team list should return error for error case', (done) => {
    teamOps.listAllTeams = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/teams'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single team', (done) => {
    const teamStub = {
      id: 1,
      name: 'Team A',
      users: [],
      policies: []
    }

    teamOps.readTeamById = (params, cb) => {
      process.nextTick(() => {
        cb(null, teamStub)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/teams/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(teamStub)

      done()
    })
  })

  lab.test('create new team', (done) => {
    const newTeamStub = {
      id: 2,
      name: 'Team B',
      description: 'This is Team B',
      users: [],
      policies: []
    }

    teamOps.createTeam = (params, cb) => {
      process.nextTick(() => {
        cb(null, newTeamStub)
      })
    }

    const options = {
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team B',
        description: 'This is Team B'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(newTeamStub)

      done()
    })
  })

  lab.test('create new team should return a 400 Bad Request when not providing name or description', (done) => {
    const options = {
      method: 'POST',
      url: '/authorization/teams',
      payload: {}
    }

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('create new team should return error for error case', (done) => {
    teamOps.createTeam = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = {
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team C',
        description: 'This is Team C'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update team', (done) => {
    const teamStub = {
      id: 2,
      name: 'Team C',
      description: 'Team B is now Team C',
      users: [],
      policies: []
    }

    teamOps.updateTeam = (params, cb) => {
      process.nextTick(() => {
        cb(null, teamStub)
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
        name: 'Team C',
        description: 'Team B is now Team C'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(teamStub)

      done()
    })
  })

  lab.test('update team should return error for error case', (done) => {
    teamOps.updateTeam = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
        name: 'Team D',
        description: 'Can Team C become Team D?'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete team should return 204 for success', (done) => {
    teamOps.deleteTeamById = (params, cb) => {
      process.nextTick(() => {
        cb(null)
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/teams/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete team should return error for error case', (done) => {
    teamOps.deleteTeamById = (params, cb) => {
      process.nextTick(() => {
        cb(Boom.badImplementation())
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/teams/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
