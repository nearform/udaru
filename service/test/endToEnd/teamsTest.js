'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const server = require('./../../wiring-hapi')
const teamOps = require('./../../lib/ops/teamOps')
const organizationOps = require('./../../lib/ops/organizationOps')
const userOps = require('./../../lib/ops/userOps')

lab.experiment('Teams - get/list', () => {
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
          id: '1',
          name: 'Admins',
          organizationId: 'WONKA',
          description: 'Administrators of the Authorization System',
          path: '1'
        },
        {
          id: '3',
          name: 'Authors',
          organizationId: 'WONKA',
          description: 'Content contributors',
          path: '3'
        },
        {
          id: '6',
          name: 'Company Lawyer',
          organizationId: 'WONKA',
          description: 'Author of legal documents',
          path: '6'
        },
        {
          id: '4',
          name: 'Managers',
          organizationId: 'WONKA',
          description: 'General Line Managers with confidential info',
          path: '4'
        },
        {
          id: '5',
          name: 'Personnel Managers',
          organizationId: 'WONKA',
          description: 'Personnel Line Managers with confidential info',
          path: '5'
        },
        {
          id: '2',
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
        id: '1',
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
})

lab.experiment('Teams - create', () => {
  lab.test('default', (done) => {
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
      expect(result).to.contain({
        name: 'Team B',
        organizationId: 'WONKA',
        description: 'This is Team B',
        users: [],
        policies: []
      })

      expect(result.path).to.equal(result.id)

      teamOps.deleteTeam({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('support specific id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'test_fixed_id',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.contain({
        id: 'test_fixed_id',
        path: 'test_fixed_id'
      })

      teamOps.deleteTeam({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('validates specific id format', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'invalid-id',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      expect(response.result.validation.keys).to.include('id')
      done()
    })
  })

  lab.test('should return a 400 Bad Request when not providing name or description', (done) => {
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
})

lab.experiment('Teams - update', () => {
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
        id: '1',
        name: 'Team C',
        description: 'Administrators of the Authorization System',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      teamOps.updateTeam({ id: '1', name: 'Admins', organizationId: result.organizationId }, done)
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
        id: '1',
        name: 'Admins',
        description: 'Team B is now Team C',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 1, name: 'Director', version: '0.1' }]
      })

      teamOps.updateTeam({ id: '1', description: 'Administrators of the Authorization System', organizationId: result.organizationId }, done)
    })
  })

  lab.test('update team', (done) => {
    const teamOriginalData = {
      id: '1',
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
        id: '1',
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
})

lab.experiment('Teams - delete', () => {
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
})

lab.experiment('Teams - manage users', () => {
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
        id: '2',
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

      teamOps.replaceUsersInTeam({ id: '2', users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
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
        id: '2',
        name: 'Readers',
        description: 'General read-only access',
        path: '2',
        organizationId: 'WONKA',
        users: [{ id: 'MikeId', name: 'Mike Teavee' }],
        policies: []
      })

      teamOps.replaceUsersInTeam({ id: '2', users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
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

      teamOps.replaceUsersInTeam({ id: '2', users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
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

      teamOps.replaceUsersInTeam({ id: '2', users: ['CharlieId', 'VerucaId'], organizationId: 'WONKA' }, done)
    })
  })
})

lab.experiment('Teams - nest/un-nest', () => {
  lab.test('Nest team should update the team path', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/nest',
      payload: {
        parentId: '3'
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        id: '2',
        name: 'Readers',
        description: 'General read-only access',
        path: '3.2',
        organizationId: 'WONKA',
        users: [
          { id: 'CharlieId', name: 'Charlie Bucket' },
          { id: 'VerucaId', name: 'Veruca Salt' }
        ],
        policies: []
      })

      teamOps.moveTeam({ id: result.id, parentId: null, organizationId: result.organizationId }, done)
    })
  })

  lab.test('Un-nest team should update the team path', (done) => {
    teamOps.moveTeam({ id: '2', parentId: '3', organizationId: 'WONKA' }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${res.id}/unnest`
      })

      server.inject(options, (response) => {
        const { result } = response

        expect(response.statusCode).to.equal(201)
        expect(result).to.equal({
          id: '2',
          name: 'Readers',
          description: 'General read-only access',
          path: '2',
          organizationId: 'WONKA',
          users: [
            { id: 'CharlieId', name: 'Charlie Bucket' },
            { id: 'VerucaId', name: 'Veruca Salt' }
          ],
          policies: []
        })

        done()
      })
    })
  })
})

lab.experiment('Teams - manage policies', () => {
  lab.test('Add one policy to a team', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [2]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: '1',
        name: 'Admins',
        description: 'Administrators of the Authorization System',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [
          { id: 2, name: 'Accountant', version: '0.1' },
          { id: 1, name: 'Director', version: '0.1' }
        ]
      })

      teamOps.replaceTeamPolicies({ id: result.id, policies: [1], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Add multiple policies to a team', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [4, 5, 6]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: '1',
        name: 'Admins',
        description: 'Administrators of the Authorization System',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [
          { id: 5, name: 'DB Admin', version: '0.1' },
          { id: 6, name: 'DB Only Read', version: '0.1' },
          { id: 1, name: 'Director', version: '0.1' },
          { id: 4, name: 'Finance Director', version: '0.1' }
        ]
      })

      teamOps.replaceTeamPolicies({ id: result.id, policies: [1], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Replace team policies', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [6]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: '1',
        name: 'Admins',
        description: 'Administrators of the Authorization System',
        path: '1',
        organizationId: 'WONKA',
        users: [{ id: 'AugustusId', name: 'Augustus Gloop' }],
        policies: [{ id: 6, name: 'DB Only Read', version: '0.1' }]
      })

      teamOps.replaceTeamPolicies({ id: result.id, policies: [1], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Delete team policies', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      teamOps.replaceTeamPolicies({ id: '1', policies: [1], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('default team admin should be able to assign users to own team', (done) => {
    teamOps.createTeam({
      name: 'Team 5',
      description: 'This is a test team',
      parentId: null,
      organizationId: 'WONKA',
      user: { id: 'test-admin', name: 'Test Admin' }
    }, (err, team) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}/users`,
        headers: {
          authorization: 'test-admin'
        },
        payload: {
          users: ['CharlieId', 'MikeId']
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal({
          id: team.id,
          name: 'Team 5',
          description: 'This is a test team',
          path: team.path,
          organizationId: 'WONKA',
          users: [
            { id: 'CharlieId', name: 'Charlie Bucket' },
            { id: 'MikeId', name: 'Mike Teavee' },
            { id: 'test-admin', name: 'Test Admin' }
          ],
          policies: []
        })

        teamOps.deleteTeam({ id: team.id, organizationId: 'WONKA' }, (err) => {
          if (err) return done(err)
          userOps.deleteUser({ id: 'test-admin', organizationId: 'WONKA' }, done)
        })
      })

    })
  })

  lab.test('Delete specific team policy', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies/1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      teamOps.replaceTeamPolicies({ id: '1', policies: [1], organizationId: 'WONKA' }, done)
    })
  })
})

lab.experiment('Teams - checking org_id scoping', () => {
  let teamId

  lab.before((done) => {
    organizationOps.create({ id: 'NEWORG', name: 'new org', description: 'new org' }, (err, org) => {
      if (err) return done(err)

      teamOps.createTeam({ name: 'otherTeam', description: 'd', parentId: null, organizationId: 'NEWORG' }, (err, team) => {
        if (err) return done(err)

        teamId = team.id
        userOps.createUser({ id: 'testUserId', name: 'testUser', organizationId: 'NEWORG' }, done)
      })
    })
  })

  lab.after((done) => {
    organizationOps.deleteById('NEWORG', done)
  })

  lab.test('Adding a user from another organization should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('Adding multiple users from different organizations should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId', 'MikeId']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('Replacing users from another organization should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId', 'MikeId']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('moving a team to another organization should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${teamId}/nest`,
      payload: {
        parentId: '1'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })
})
