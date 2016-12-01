'use strict'

const nock = require('nock')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const initServer = require('../../initServer')

let server

lab.before(function (done) {
  initServer(function (s) {
    server = s
    done()
  })
})

lab.experiment('Teams', () => {
  lab.test('get team list', (done) => {
    const teamListStub = [{
      id: 1,
      name: 'Team A'
    }, {
      id: 2,
      name: 'Team B'
    }]

    nock('http://localhost:8080')
      .get('/authorization/teams')
      .reply(200, teamListStub)


    const options = {
      method: 'GET',
      url: '/authorization/teams'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(teamListStub)

      done()
    })
  })

  lab.test('get team list should return error for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/teams')
      .reply(500)

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

    nock('http://localhost:8080')
      .get('/authorization/teams/1')
      .reply(200, teamStub)

    const options = {
      method: 'GET',
      url: '/authorization/teams/1'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

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

    nock('http://localhost:8080')
      .post('/authorization/teams')
      .reply(201, newTeamStub)

    const options = {
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team B',
        description: 'This is Team B'
      }
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

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

    nock('http://localhost:8080')
      .post('/authorization/teams')
      .reply(400)

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('create new team should return error for error case', (done) => {
    nock('http://localhost:8080')
      .post('/authorization/teams')
      .reply(500)

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

    nock('http://localhost:8080')
      .put('/authorization/teams/2')
      .reply(200, teamStub)

    const options = {
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
        name: 'Team C',
        description: 'Team B is now Team C'
      }
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(teamStub)

      done()
    })
  })

  lab.test('update team should return error for error case', (done) => {
    nock('http://localhost:8080')
      .put('/authorization/teams/2')
      .reply(500)

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
    nock('http://localhost:8080')
      .delete('/authorization/teams/1')
      .reply(204)

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
    nock('http://localhost:8080')
      .delete('/authorization/teams/1')
      .reply(500)

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
