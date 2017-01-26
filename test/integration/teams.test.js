'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../utils')
const server = require('../../lib/server')
const { udaru } = utils

const teamData = {
  name: 'testTeam',
  description: 'This is a test team',
  parentId: null,
  organizationId: 'WONKA'
}

lab.experiment('Teams - get/list', () => {
  lab.test('get team list: with pagination params', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.page).to.equal(1)
      expect(response.result.limit).greaterThan(1)
      done()
    })
  })

  lab.test('get teams list from organization with no team', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams',
      headers: {
        authorization: 'ROOTid'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.page).to.equal(1)
      expect(response.result.limit).greaterThan(1)
      expect(response.result.total).equal(0)
      done()
    })
  })

  lab.test('get team list: page 1', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?limit=3&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(3)
      expect(result.total).to.equal(6)
      expect(result.data).to.equal([
        {
          id: '1',
          name: 'Admins',
          organizationId: 'WONKA',
          description: 'Administrators of the Authorization System',
          path: '1',
          usersCount: 1
        },
        {
          id: '3',
          name: 'Authors',
          organizationId: 'WONKA',
          description: 'Content contributors',
          path: '3',
          usersCount: 1
        },
        {
          id: '6',
          name: 'Company Lawyer',
          organizationId: 'WONKA',
          description: 'Author of legal documents',
          path: '6',
          usersCount: 0
        }
      ])

      done()
    })
  })

  lab.test('get team list: page 2', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?limit=3&page=2'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(2)
      expect(result.limit).to.equal(3)
      expect(result.total).to.equal(6)
      expect(result.data).to.equal([
        {
          id: '4',
          name: 'Managers',
          organizationId: 'WONKA',
          description: 'General Line Managers with confidential info',
          path: '4',
          usersCount: 1
        },
        {
          id: '5',
          name: 'Personnel Managers',
          organizationId: 'WONKA',
          description: 'Personnel Line Managers with confidential info',
          path: '5',
          usersCount: 1
        },
        {
          id: '2',
          name: 'Readers',
          organizationId: 'WONKA',
          description: 'General read-only access',
          path: '2',
          usersCount: 2
        }
      ])

      done()
    })
  })

  lab.test('get team list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?page=1&limit=7'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.data).to.equal([
        {
          id: '1',
          name: 'Admins',
          organizationId: 'WONKA',
          description: 'Administrators of the Authorization System',
          path: '1',
          usersCount: 1
        },
        {
          id: '3',
          name: 'Authors',
          organizationId: 'WONKA',
          description: 'Content contributors',
          path: '3',
          usersCount: 1
        },
        {
          id: '6',
          name: 'Company Lawyer',
          organizationId: 'WONKA',
          description: 'Author of legal documents',
          path: '6',
          usersCount: 0
        },
        {
          id: '4',
          name: 'Managers',
          organizationId: 'WONKA',
          description: 'General Line Managers with confidential info',
          path: '4',
          usersCount: 1
        },
        {
          id: '5',
          name: 'Personnel Managers',
          organizationId: 'WONKA',
          description: 'Personnel Line Managers with confidential info',
          path: '5',
          usersCount: 1
        },
        {
          id: '2',
          name: 'Readers',
          organizationId: 'WONKA',
          description: 'General read-only access',
          path: '2',
          usersCount: 2
        }
      ])

      done()
    })
  })

  lab.test('get single team', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${team.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.usersCount).to.exist()
        expect(result.usersCount).to.equal(0)
        expect(result.id).to.equal(team.id)
        expect(result.name).to.equal(team.name)

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })

  lab.test('get users for a single team', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)
      const teamUsers = [
          { id: 'AugustusId', name: 'Augustus Gloop' },
          { id: 'CharlieId', name: 'Charlie Bucket' },
          { id: 'MikeId', name: 'Mike Teavee' },
          { id: 'VerucaId', name: 'Veruca Salt' },
          { id: 'WillyId', name: 'Willy Wonka' }
      ]
      const teamUsersIds = teamUsers.map((user) => { return user.id })

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: teamUsersIds}, (err, team) => {
        if (err) return done(err)

        expect(team.users).to.equal(teamUsers)

        const options = utils.requestOptions({
          method: 'GET',
          url: `/authorization/teams/${team.id}/users?page=1&limit=10`
        })

        server.inject(options, (response) => {
          const result = response.result

          expect(response.statusCode).to.equal(200)
          expect(result.page).to.equal(1)
          expect(result.limit).to.equal(10)
          expect(result.total).to.equal(5)
          expect(result.data).to.equal(teamUsers)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/teams/${team.id}/users?page=2&limit=3`
          })

          server.inject(options, (response) => {
            const result = response.result

            expect(response.statusCode).to.equal(200)
            expect(result.page).to.equal(2)
            expect(result.limit).to.equal(3)
            expect(result.total).to.equal(5)
            expect(result.data).to.equal([
              { id: 'VerucaId', name: 'Veruca Salt' },
              { id: 'WillyId', name: 'Willy Wonka' }
            ])

            udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
          })
        })
      })
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
        policies: [],
        path: result.id
      })

      udaru.teams.delete({ id: result.id, organizationId: result.organizationId }, done)
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

      udaru.teams.delete({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('will not complain for empty id string', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: '',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.equal('')

      udaru.teams.delete({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('support handling of already present id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: '1',
        name: 'Team already present',
        description: 'This is already present'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.message).to.equal('Team with id 1 already present')

      done()
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
    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}`,
        payload: {
          name: 'Team C'
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal(team.id)
        expect(result.name).to.equal('Team C')

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })

  lab.test('update only team description', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}`,
        payload: {
          description: 'Team B is now Team C'
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal(team.id)
        expect(result.description).to.equal('Team B is now Team C')

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })

  lab.test('update team', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}`,
        payload: {
          name: 'Team C',
          description: 'Team B is now Team C'
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal(team.id)
        expect(result.name).to.equal('Team C')
        expect(result.description).to.equal('Team B is now Team C')

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })
})

lab.experiment('Teams - delete', () => {
  lab.test('delete team should return 204 for success', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/teams/${team.id}`
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
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}/users`,
        payload: {
          users: ['CharlieId', 'MikeId']
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal(team.id)
        expect(result.users).to.equal([
          { id: 'CharlieId', name: 'Charlie Bucket' },
          { id: 'MikeId', name: 'Mike Teavee' }
        ])

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })

  lab.test('replace users in a team', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: ['CharlieId']}, (err, team) => {
        if (err) return done(err)

        const options = utils.requestOptions({
          method: 'POST',
          url: `/authorization/teams/${team.id}/users`,
          payload: {
            users: ['MikeId']
          }
        })

        server.inject(options, (response) => {
          const result = response.result

          expect(response.statusCode).to.equal(200)
          expect(result.id).to.equal(team.id)
          expect(result.users).to.equal([
            { id: 'MikeId', name: 'Mike Teavee' }
          ])

          udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
        })
      })
    })
  })

  lab.test('delete all team members', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId']}, (err, team) => {
        if (err) return done(err)

        const options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/teams/${team.id}/users`
        })

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(204)

          udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
        })
      })
    })
  })

  lab.test('delete one team member', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId']}, (err, team) => {
        if (err) return done(err)

        const options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/teams/${team.id}/users/CharlieId`
        })

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(204)

          udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
        })
      })
    })
  })

  lab.test('default team admin should be able to assign users to own team', (done) => {
    udaru.teams.create({
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
          usersCount: 3,
          users: [
            { id: 'CharlieId', name: 'Charlie Bucket' },
            { id: 'MikeId', name: 'Mike Teavee' },
            { id: 'test-admin', name: 'Test Admin' }
          ],
          policies: []
        })

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, (err) => {
          if (err) return done(err)
          udaru.users.delete({ id: 'test-admin', organizationId: team.organizationId }, done)
        })
      })
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

      expect(response.statusCode).to.equal(200)
      expect(result.path).to.equal('3.2')

      udaru.teams.move({ id: result.id, parentId: null, organizationId: result.organizationId }, done)
    })
  })

  lab.test('Un-nest team should update the team path', (done) => {
    udaru.teams.move({ id: '2', parentId: '3', organizationId: 'WONKA' }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${res.id}/unnest`
      })

      server.inject(options, (response) => {
        const { result } = response

        expect(response.statusCode).to.equal(200)
        expect(result.path).to.equal('2')

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
        policies: ['policyId2']
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.equal([
        { id: 'policyId2', name: 'Accountant', version: '0.1' },
        { id: 'policyId1', name: 'Director', version: '0.1' }
      ])

      udaru.teams.replacePolicies({ id: result.id, policies: ['policyId1'], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Add one policy from another org to a team should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: ['policyId9']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('Add multiple policies to a team', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: ['policyId4', 'policyId5', 'policyId6']
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.equal([
        { id: 'policyId5', name: 'DB Admin', version: '0.1' },
        { id: 'policyId6', name: 'DB Only Read', version: '0.1' },
        { id: 'policyId1', name: 'Director', version: '0.1' },
        { id: 'policyId4', name: 'Finance Director', version: '0.1' }
      ])

      udaru.teams.replacePolicies({ id: result.id, policies: ['policyId1'], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Replace team policies', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: ['policyId6']
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.equal([{ id: 'policyId6', name: 'DB Only Read', version: '0.1' }])

      udaru.teams.replacePolicies({ id: result.id, policies: ['policyId1'], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Replace team policies from another org should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: ['policyId9']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('Delete team policies', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      udaru.teams.replacePolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('Delete specific team policy', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies/policyId1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      udaru.teams.replacePolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, done)
    })
  })
})

lab.experiment('Teams - checking org_id scoping', () => {
  let teamId

  lab.before((done) => {
    udaru.organizations.create({ id: 'NEWORG', name: 'new org', description: 'new org' }, (err, org) => {
      if (err) return done(err)

      udaru.teams.create({ name: 'otherTeam', description: 'd', parentId: null, organizationId: 'NEWORG' }, (err, team) => {
        if (err) return done(err)

        teamId = team.id
        udaru.users.create({ id: 'testUserId', name: 'testUser', organizationId: 'NEWORG' }, done)
      })
    })
  })

  lab.after((done) => {
    udaru.organizations.delete('NEWORG', done)
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
