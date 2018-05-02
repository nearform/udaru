'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../../udaru-core/test/testUtils')
const server = require('../test-server')()
const udaru = require('@nearform/udaru-core')()
const sinon = require('sinon')

const teamData = {
  name: 'testTeam',
  description: 'This is a test team',
  parentId: null,
  organizationId: 'WONKA'
}

const metadata = {key1: 'val1', key2: 'val2'}
const teamDataMeta = {
  name: 'testTeamMeta',
  description: 'This is a test team with metadata',
  parentId: null,
  organizationId: 'WONKA',
  metadata: metadata
}

lab.experiment('Teams - search', () => {
  lab.test('searching for teams', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/search?query=test`
    })

    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.data).to.exist()
        expect(result.total).to.exist()

        expect(result.data.length).to.equal(1)
        expect(result.total).to.equal(1)

        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })

  lab.test('searching for teams should handle server errors', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/search?query=test`
    })

    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const stub = sinon.stub(server.udaru.teams, 'search').yields(new Error('ERROR'))
      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        udaru.teams.delete({ id: team.id, organizationId: team.organizationId }, done)
      })
    })
  })
})

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

  lab.test('get team list should handle server errors', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?page=1&limit=7'
    })

    const stub = sinon.stub(server.udaru.teams, 'list').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
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

  lab.test('get single team with metadata', (done) => {
    udaru.teams.create(teamDataMeta, (err, team) => {
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
        expect(result.metadata).to.equal(team.metadata)

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

  lab.test('return 404 if team does not exist when requesting users', (done) => {
    const teamId = 'idontexist'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(result.statusCode).to.equal(404)
      expect(result.data).to.not.exist()
      expect(result.total).to.not.exist()
      expect(result.error).to.exist()
      expect(result.message).to.exist()
      expect(result.message.toLowerCase()).to.include(teamId).include('not').include('found')

      done()
    })
  })
})

lab.experiment('Teams - create', () => {
  lab.test('Create with no id', (done) => {
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
      expect(result.id).to.not.be.null()
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

  lab.test('Create with undefined id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: undefined,
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
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

  lab.test('Create with specific id', (done) => {
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

  lab.test('create team with empty id string', (done) => {
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

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create team with null id string', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: null,
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
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

      expect(response.statusCode).to.equal(409)
      expect(result.message).to.equal('Key (id)=(1) already exists.')

      done()
    })
  })

  lab.test('Create a team with metadata', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'test_meta_id',
        name: 'Team Meta',
        description: 'This is Team Meta',
        metadata: metadata
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.contain({
        id: 'test_meta_id',
        path: 'test_meta_id',
        description: 'This is Team Meta',
        metadata: metadata
      })

      udaru.teams.delete({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('validates specific id format', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'invalid?id',
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

  lab.test('update team with metadata', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${team.id}`,
        payload: {
          name: 'Team Meta',
          description: 'Team B is now Team Meta',
          metadata: metadata
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal(team.id)
        expect(result.name).to.equal('Team Meta')
        expect(result.description).to.equal('Team B is now Team Meta')
        expect(result.metadata).to.equal(metadata)

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
        expect(result).to.not.exist()

        done()
      })
    })
  })

  lab.test('delete team should return 500 for server errors', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/teams/${team.id}`
      })

      const stub = sinon.stub(server.udaru.teams, 'delete').yields(new Error('ERROR'))

      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        udaru.teams.delete({id: team.id, organizationId: team.organizationId}, done)
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

  lab.test('delete all team members should handle server errors', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId']}, (err, team) => {
        if (err) return done(err)

        const options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/teams/${team.id}/users`
        })

        const stub = sinon.stub(server.udaru.teams, 'deleteMembers').yields(new Error('ERROR'))

        server.inject(options, (response) => {
          stub.restore()

          expect(response.statusCode).to.equal(500)
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

  lab.test('delete one team member should handle server errors', (done) => {
    udaru.teams.create(teamData, (err, team) => {
      if (err) return done(err)

      udaru.teams.addUsers({id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId']}, (err, team) => {
        if (err) return done(err)

        const options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/teams/${team.id}/users/CharlieId`
        })

        const stub = sinon.stub(server.udaru.teams, 'deleteMember').yields(new Error('ERROR'))

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(500)
          stub.restore()

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

  lab.test('Un-nest team should handle server errors', (done) => {
    udaru.teams.move({ id: '2', parentId: '3', organizationId: 'WONKA' }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${res.id}/unnest`
      })

      const stub = sinon.stub(server.udaru.teams, 'move').yields(new Error('ERROR'))

      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        udaru.teams.move({ id: '2', parentId: null, organizationId: 'WONKA' }, done)
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
        policies: [{id: 'policyId2'}]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {} },
        { id: 'policyId1', name: 'Director', version: '0.1', variables: {} }
      ])

      udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Add one policy with variables to a team', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{
          id: 'policyId2',
          variables: {var1: 'value1'}
        }]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} },
        { id: 'policyId1', name: 'Director', version: '0.1', variables: {} }
      ])

      udaru.teams.deletePolicies({ id: result.id, organizationId: result.organizationId }, done)
    })
  })

  lab.test('Policy instance addition and removal', (done) => {
    let options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/policies',
      payload: {
        policies: [{
          id: 'policyId2',
          variables: {var1: 'value1'}
        }]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result.policies.length).to.equal(1)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
      ])

      const firstInstance = result.policies[0].instance

      options.payload = {
        policies: [{
          id: 'policyId2',
          variables: {var1: 'valuex'},
          instance: firstInstance
        }, {
          id: 'policyId2',
          variables: {var2: 'value2'}
        }, {
          id: 'policyId2',
          variables: {var3: 'value3'}
        }]
      }

      server.inject(options, (response) => {
        const { result } = response

        expect(response.statusCode).to.equal(200)
        expect(result.policies.length).to.equal(3)
        expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
          { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var3: 'value3'} },
          { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var2: 'value2'} }
        ])
        expect(result.policies).to.contain([
          { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'valuex'}, instance: firstInstance }
        ])

        options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/teams/2/policies/policyId2?instance=${firstInstance}`
        })

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(204)

          options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/teams/2`
          })

          server.inject(options, (response) => {
            const { result } = response
            expect(response.statusCode).to.equal(200)
            expect(result.policies.length).to.equal(2)
            expect(utils.PoliciesWithoutInstance(result.policies)).to.not.contain([
              { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
            ])

            options = utils.requestOptions({
              method: 'DELETE',
              url: `/authorization/teams/2/policies/policyId2`
            })

            server.inject(options, (response) => {
              expect(response.statusCode).to.equal(204)

              options = utils.requestOptions({
                method: 'GET',
                url: `/authorization/teams/2`
              })

              server.inject(options, (response) => {
                const { result } = response
                expect(response.statusCode).to.equal(200)
                expect(result.policies.length).to.equal(0)

                udaru.teams.replacePolicies({ id: result.id, policies: [], organizationId: result.organizationId }, done)
              })
            })
          })
        })
      })
    })
  })

  lab.test('Add to one team a policy with invalid ID should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'InvalidID'}]
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('Add one policy from another org to a team should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId9'}]
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
        policies: [{id: 'policyId4'}, {id: 'policyId5'}, {id: 'policyId6'}]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
        { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
        { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
      ])

      udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId }, done)
    })
  })

  lab.test('List multiple policies', (done) => {
    let options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId4'}, {id: 'policyId5'}, {id: 'policyId6'}]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
        { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
        { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
        { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
      ])

      options = utils.requestOptions({
        method: 'GET',
        url: '/authorization/teams/1/policies'
      })

      server.inject(options, (response) => {
        const { result } = response

        expect(response.statusCode).to.equal(200)
        expect(utils.PoliciesWithoutInstance(result.data)).to.equal([
          { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
          { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
          { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
          { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
        ])

        options = utils.requestOptions({
          method: 'GET',
          url: '/authorization/teams/1/policies?limit=100&page=1'
        })

        server.inject(options, (response) => {
          const { result } = response

          expect(response.statusCode).to.equal(200)
          expect(utils.PoliciesWithoutInstance(result.data)).to.equal([
            { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
            { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
            { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
            { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
          ])

          udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('get non existent teams policies', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/X/policies?limit=100&page=1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(404)
      done()
    })
  })

  lab.test('Replace team policies', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId6'}]
      }
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([{
        id: 'policyId6',
        name: 'DB Only Read',
        version: '0.1',
        variables: {}
      }])

      udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId }, done)
    })
  })

  lab.test('Replace team policies with a policy with invalid ID should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'InvalidID'}]
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test(' from another org should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId9'}]
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

      udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('Delete team policies should handle server errors', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies'
    })

    const stub = sinon.stub(server.udaru.teams, 'deletePolicies').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
      udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('Delete specific team policy', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies/policyId1'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)

      udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' }, done)
    })
  })

  lab.test('Delete specific team policy should handle server errors', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies/policyId1'
    })

    const stub = sinon.stub(server.udaru.teams, 'deletePolicy').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
      udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' }, done)
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

  lab.test('Adding a user with invalid ID should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['invalidUserId']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
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

  lab.test('Adding a user with invalid ID should not be permitted', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['InvalidUserId']
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

  lab.test('get error if team does not exist', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/IDONTEXIST/nested`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(result.statusCode).to.equal(404)
      expect(result.error).to.exist()
      expect(result.message).to.include('not').include('found')

      done()
    })
  })

  lab.test('get nested team list with default paging', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.greaterThan(1)
      expect(result.total).to.equal(1)
      expect(result.data).to.equal([
        {
          id: '6',
          name: 'Company Lawyer',
          description: 'Author of legal documents',
          parentId: '3',
          path: '6',
          organizationId: 'WONKA',
          usersCount: 0
        }
      ])

      done()
    })
  })

  lab.test('get nested team list with paging', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=1&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(1)
      expect(result.total).to.equal(1)
      expect(result.data).to.equal([
        {
          id: '6',
          name: 'Company Lawyer',
          description: 'Author of legal documents',
          parentId: '3',
          path: '6',
          organizationId: 'WONKA',
          usersCount: 0
        }
      ])

      done()
    })
  })

  lab.test('get nested team list with bad paging param', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=1&page=0'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.message).to.exist()
      expect(result.data).to.not.exist()

      done()
    })
  })

  lab.test('get nested team list with bad limit param', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=0&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.message).to.exist()
      expect(result.data).to.not.exist()

      done()
    })
  })

  lab.test('get nested team list should handle server error', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested'
    })

    const stub = sinon.stub(server.udaru.teams, 'listNestedTeams').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
      done()
    })
  })

  lab.experiment('Teams User Search', () => {
    lab.test('searching for a real user in an existing team', (done) => {
      const teamId = '4'
      const query = 'Will'

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${teamId}/users/search?query=${query}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.data).to.exist()
        expect(result.total).to.exist()

        expect(result.data.length).to.equal(1)
        expect(result.total).to.equal(1)

        done()
      })
    })

    lab.test('searching for a user that does not exist in an existing team', (done) => {
      const teamId = '4'
      const query = 'IDONTEXIST'

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${teamId}/users/search?query=${query}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.data).to.exist()
        expect(result.total).to.exist()

        expect(result.data.length).to.equal(0)
        expect(result.total).to.equal(0)

        done()
      })
    })

    lab.test('searching for a real user in a non-existing team', (done) => {
      const teamId = 'IDONTEXIST'
      const query = 'Will'

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${teamId}/users/search?query=${query}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(404)
        expect(result.data).to.not.exist()
        expect(result.total).to.not.exist()

        expect(result.error).to.exist()
        expect(result.message).to.include('not').include('found')

        done()
      })
    })

    lab.test('missing query string', (done) => {
      const teamId = 'IDONTEXIST'

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${teamId}/users/search?query=`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(400)

        expect(result.error).to.exist()
        expect(result.error.toLowerCase()).to.include('bad').include('request')

        done()
      })
    })

    lab.test('missing team id param string', (done) => {
      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams//users/search?query='query'`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(404)

        expect(result.error).to.exist()
        expect(result.message.toLowerCase()).to.include('not').include('found')

        done()
      })
    })

    lab.test('searching for a real user in an existing team should handle server errors', (done) => {
      const teamId = '4'
      const query = 'Will'

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/teams/${teamId}/users/search?query=${query}`
      })

      const stub = sinon.stub(server.udaru.teams, 'searchUsers').yields(new Error('ERROR'))
      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        done()
      })
    })
  })
})
