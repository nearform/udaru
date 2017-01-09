'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const server = require('./../../wiring-hapi')
const teamOps = require('./../../lib/ops/teamOps')

lab.experiment('Teams', () => {
  lab.test('get team list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal([
        {
          id: 1,
          name: 'Admins',
          organizationId: 'WONKA',
          description: 'Administrators of the Authorization System',
          path: '1'
        },
        {
          id: 3,
          name: 'Authors',
          organizationId: 'WONKA',
          description: 'Content contributors',
          path: '3'
        },
        {
          id: 6,
          name: 'Company Lawyer',
          organizationId: 'WONKA',
          description: 'Author of legal documents',
          path: '6'
        },
        {
          id: 4,
          name: 'Managers',
          organizationId: 'WONKA',
          description: 'General Line Managers with confidential info',
          path: '4'
        },
        {
          id: 5,
          name: 'Personnel Managers',
          organizationId: 'WONKA',
          description: 'Personnel Line Managers with confidential info',
          path: '5'
        },
        {
          id: 2,
          name: 'Readers',
          organizationId: 'WONKA',
          description: 'General read-only access',
          path: '2'
        }
      ])

      done()
    })
  })

  lab.test('get single team', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 1,
        name: 'Admins',
        organizationId: 'WONKA',
        description: 'Administrators of the Authorization System',
        path: '1',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      done()
    })
  })

  lab.test('create new team', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        id: 7,
        name: 'Team B',
        organizationId: 'WONKA',
        description: 'This is Team B',
        path: '7',
        users: [],
        policies: []
      })

      teamOps.deleteTeam({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('create new team should return a 400 Bad Request when not providing name or description', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {}
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('update team validation nothing in payload', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('update only team name', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1',
      payload: {
        name: 'Team C'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 1,
        name: 'Team C',
        description: 'Administrators of the Authorization System',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      teamOps.updateTeam({ id: 1, name: 'Admins', organizationId: result.organizationId }, done)
    })
  })

  lab.test('update only team description', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1',
      payload: {
        description: 'Team B is now Team C'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 1,
        name: 'Admins',
        description: 'Team B is now Team C',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      teamOps.updateTeam({ id: 1, description: 'Administrators of the Authorization System', organizationId: result.organizationId }, done)
    })
  })

  lab.test('update team', (done) => {
    const teamOriginalData = {
      id: 1,
      name: 'Admins',
      organizationId: 'WONKA',
      description: 'Administrators of the Authorization System'
    }
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1',
      payload: {
        name: 'Team C',
        description: 'Team B is now Team C'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 1,
        name: 'Team C',
        organizationId: 'WONKA',
        description: 'Team B is now Team C',
        path: '1',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      teamOps.updateTeam(teamOriginalData, done)
    })
  })

  lab.test('delete team should return 204 for success', (done) => {
    teamOps.createTeam({ name: 'Team 4', description: 'This is a test team', parentId: null, organizationId: 'WONKA' }, (err, result) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/teams/${result.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(204)
        expect(result).to.be.undefined

        done()
      })
    })
  })

  lab.test('add users to a team', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['CharlieId', 'MikeId']
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 2,
        name: 'Readers',
        description: 'General read-only access',
        path: '2',
        organizationId: 'WONKA',
        users: [
          { id: 'CharlieId', name: 'Charlie Bucket' },
          { id: 'MikeId', name: 'Mike Teavee' },
          { id: 'VerucaId', name: 'Veruca Salt' }
        ],
        policies: []
      })

      teamOps.replaceUsersInTeam({ id: 2, users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('relace users in a team', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['MikeId']
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 2,
        name: 'Readers',
        description: 'General read-only access',
        path: '2',
        organizationId: 'WONKA',
        users: [{ id: 'MikeId', name: 'Mike Teavee' }],
        policies: []
      })

      teamOps.replaceUsersInTeam({ id: 2, users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('delete all team members', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/2/users'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.not.exist()

      teamOps.replaceUsersInTeam({ id: 2, users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('delete one team member', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/2/users/CharlieId'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.not.exist()

      teamOps.replaceUsersInTeam({ id: 2, users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
    })
  })

})
