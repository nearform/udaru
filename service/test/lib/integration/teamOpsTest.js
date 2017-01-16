
'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const crypto = require('crypto')

const teamOps = require('../../../lib/ops/teamOps')
const policyOps = require('../../../lib/ops/policyOps')
const userOps = require('../../../lib/ops/userOps')

function randomId () {
  return crypto.randomBytes(2).toString('hex')
}

lab.experiment('TeamOps', () => {

  let testTeam
  let users
  let policies = []
  lab.before(done => {
    userOps.listOrgUsers({organizationId: 'WONKA'}, (err, fetchedUsers) => {
      expect(err).to.not.exist()
      expect(fetchedUsers).to.exist()
      expect(fetchedUsers.length).to.be.at.least(2)
      users = fetchedUsers

      policyOps.createPolicy({
        version: 1,
        name: randomId(),
        organizationId: 'WONKA',
        statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
      }, (err, createdPolicy) => {
        expect(err).to.not.exist()
        expect(createdPolicy).to.exist()
        policies.push(createdPolicy)

        policyOps.createPolicy({
          version: 1,
          name: randomId(),
          organizationId: 'WONKA',
          statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
        }, (err, createdPolicy) => {
          expect(err).to.not.exist()
          expect(createdPolicy).to.exist()
          policies.push(createdPolicy)

          done()
        })
      })
    })
  })

  lab.beforeEach(done => {
    testTeam = {
      name: 'test::teamOps:bfrEach:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }
    teamOps.createTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()
      testTeam.id = result.id // afterEach will cleanup based on the ID
      done()
    })
  })

  lab.afterEach(done => {
    // always cleanup test data
    if (testTeam && testTeam.id) {
      teamOps.deleteTeam({id: testTeam.id, organizationId: 'WONKA'}, done)
      testTeam = null
    } else {
      done()
    }
  })

  lab.test('list of org teams', (done) => {
    teamOps.listOrgTeams({organizationId: 'WONKA'}, (err, result) => {

      expect(err).to.not.exist()
      expect(result).to.exist()

      let expectedTeamIds = [
        'Admins',
        'Readers',
        'Authors',
        'Managers',
        'Personnel Managers',
        'Company Lawyer'
      ]
      expect(_.map(result, 'name')).contains(expectedTeamIds)
      done()
    })
  })

  lab.test('Add twice the same user to a team', (done) => {

    let userIds = [users[0].id]
    teamOps.addUsersToTeam({id: testTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()

      userIds = [users[0].id, users[1].id]
      teamOps.addUsersToTeam({id: testTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.users.length).to.equal(2)

        teamOps.readTeam({ id: testTeam.id, organizationId: 'WONKA' }, (err, readTeam) => {

          expect(err).to.not.exist()
          expect(readTeam).to.exist()
          expect(readTeam.users.length).to.equal(2)
          expect(readTeam.users).to.equal([
            _.pick(users[0], 'id', 'name'),
            _.pick(users[1], 'id', 'name')
          ])

          done()
        })
      })
    })
  })

  lab.test('create, update only the team name', (done) => {

    testTeam.name += '_n'

    teamOps.updateTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal(testTeam.name)
      expect(result.description).to.equal(testTeam.description)

      done()
    })
  })

  lab.test('create, update only the team description', (done) => {

    testTeam.description = '_d'

    teamOps.updateTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal(testTeam.name)
      expect(result.description).to.equal(testTeam.description)

      done()
    })
  })

  lab.test('read a specific team', (done) => {
    teamOps.readTeam({ id: testTeam.id, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal(testTeam.name)
      expect(result.description).to.equal(testTeam.description)
      expect(result.usersCount).to.equal(1)
      expect(result.usersCount).to.equal(result.users.length)
      expect(result.users.length).to.equal(1)
      expect(result.policies.length).to.equal(1)

      done()
    })
  })

  lab.test('read users from a specific team', (done) => {
    teamOps.readTeamUsers({ id: '2' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(2)
      expect(result).to.equal([
        { id: 'CharlieId', name: 'Charlie Bucket' },
        { id: 'VerucaId', name: 'Veruca Salt' }
      ])

      done()
    })
  })

  lab.test('paginated read users from a specific team', (done) => {
    teamOps.readTeamUsers({ id: '2', page: 2, limit: 1 }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(1)
      expect(result).to.equal([
        { id: 'VerucaId', name: 'Veruca Salt' }
      ])

      done()
    })
  })

  lab.test('creating a team should create a default admin policy', (done) => {

    policyOps.listByOrganization({organizationId: 'WONKA'}, (err, policies) => {
      expect(err).to.not.exist()

      const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeam.id })
      expect(defaultPolicy).to.exist()

      policyOps.deletePolicy({ id: defaultPolicy.id, organizationId: 'WONKA' }, (err) => {
        expect(err).to.not.exist()
        done()
      })
    })
  })

  lab.test('creating a team with createOnly option should not create a default admin policy', (done) => {
    let testTeam = {
      name: 'test::teamOps:+only:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, {createOnly: true}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()
      testTeam.id = result.id // afterEach will cleanup based on the ID

      policyOps.listByOrganization({organizationId: 'WONKA'}, (err, policies) => {
        teamOps.deleteTeam(testTeam, (err) => { if (err) throw err })
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => {
          return p.name === 'Default Team Admin for ' + testTeam.id
        })
        expect(defaultPolicy).to.not.exist()
        done()
      })
    })
  })

  lab.test('create team support creation of default team admin user', (done) => {
    let teamId = randomId()
    let testTeam = {
      name: 'test::teamOps:dfltAdmin:' + teamId,
      description: 'description',
      organizationId: 'WONKA',
      user: { name: 'test:' + teamId }
    }
    setTimeout(() => {
      // TODO: delete team
      teamOps.deleteTeam(testTeam, () => {})
    }, 5000)

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()

      const defaultUser = team.users.find((u) => { return u.name === testTeam.user.name })
      expect(defaultUser).to.exist()

      userOps.readUser({ id: defaultUser.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()

        expect(user.name).to.be.equal(testTeam.user.name)

        const defaultPolicy = user.policies.find((p) => { return p.name === 'Default Team Admin for ' + team.id })
        expect(defaultPolicy).to.exist()

        teamOps.deleteTeam({ id: team.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.not.exist()

          userOps.deleteUser({ id: user.id, organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('create team support creation of default team admin user and specific user id', (done) => {
    let teamId = randomId()
    let testTeam = {
      name: 'test::teamOps:dfltAdmin:' + teamId,
      description: 'description',
      organizationId: 'WONKA',
      user: { name: 'test:' + teamId, id: 'test:' + teamId }
    }
    setTimeout(() => {
      // TODO: delete team
      teamOps.deleteTeam(testTeam, () => {})
    }, 5000)

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()
      expect(team.users.length).to.equal(1)
      expect(team.users[0]).to.equal({ id: testTeam.user.id, name: testTeam.user.name })

      const defaultUser = team.users[0]

      userOps.readUser({ id: defaultUser.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()

        const defaultPolicy = user.policies.find((p) => { return p.name === 'Default Team Admin for ' + team.id })
        expect(defaultPolicy).to.exist()

        teamOps.deleteTeam({ id: team.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.not.exist()

          userOps.deleteUser({ id: user.id, organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('createTeam should build path', (done) => {

    let childTeam = {
      name: 'test:team:child:' + randomId(),
      description: 'child',
      parentId: testTeam.id,
      organizationId: 'WONKA'
    }

    teamOps.createTeam(childTeam, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.path).to.equal(testTeam.id + '.' + result.id)

      teamOps.deleteTeam({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('deleteTeam should also delete descendants', (done) => {
    const childTeam = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'WONKA'
    }
    childTeam.parentId = testTeam.id

    teamOps.createTeam(childTeam, (err, childTeam) => {
      expect(err).to.not.exist()
      expect(childTeam).to.exist()

      expect(childTeam.path).to.equal(testTeam.id + '.' + childTeam.id)

      teamOps.deleteTeam({ organizationId: 'WONKA', id: testTeam.id }, (err) => {
        expect(err).to.not.exist()
        testTeam = null // so that afterEach don't try to delete a team that was already deleted
        teamOps.readTeam({ id: childTeam.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.exist()
          expect(err.isBoom).to.be.true()
          expect(err.message).to.match(/Team with id [a-zA-Z0-9_]+ could not be found/)
          done()
        })
      })
    })
  })

  lab.test('moveTeam should update path', (done) => {
    let childTeam = {
      name: 'Team Child',
      description: 'This is a test team for paths',
      parentId: testTeam.id,
      organizationId: 'WONKA'
    }

    teamOps.createTeam(childTeam, (err, childTeam) => {
      expect(err).to.not.exist()
      expect(childTeam).to.exist()

      let testTeam2 = {
        name: 'Team Parent',
        description: 'This is a test team for paths',
        organizationId: 'WONKA'
      }
      teamOps.createTeam(testTeam2, (err, testTeam2) => {
        expect(err).to.not.exist()
        expect(testTeam2).to.exist()
        teamOps.moveTeam({ id: childTeam.id, parentId: testTeam2.id, organizationId: 'WONKA' }, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.path).to.equal(testTeam2.id + '.' + childTeam.id)

          teamOps.readTeam({id: childTeam.id, organizationId: 'WONKA'}, (err, result) => {
            expect(err).to.not.exist()
            expect(result).to.exist()
            expect(result.path).to.equal(testTeam2.id + '.' + childTeam.id)

            teamOps.deleteTeam({id: testTeam2.id, organizationId: 'WONKA'}, done)
          })
        })
      })
    })
  })

  lab.test('un-nest team', (done) => {

    const teamData = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: testTeam.id,
      organizationId: 'WONKA'
    }

    teamOps.createTeam(teamData, (err, result) => {
      expect(err).to.not.exist()

      const teamId = result.id

      expect(result.path).to.equal(testTeam.id + '.' + teamId)

      teamOps.moveTeam({ id: teamId, parentId: null, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.path).to.equal(teamId.toString())

        teamOps.deleteTeam({id: teamId, organizationId: 'WONKA'}, done)
      })
    })
  })

  lab.test('add policies to team', (done) => {

    teamOps.addTeamPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)
      expect(team.policies).to.only.include([
        _.pick(policies[0], 'id', 'name', 'version'),
        _.pick(policies[1], 'id', 'name', 'version')
      ])

      done()
    })
  })

  lab.test('replace team policies', (done) => {

    teamOps.addTeamPolicies({
      id: testTeam.id,
      organizationId: 'WONKA',
      policies: [policies[0].id]
    }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()

      teamOps.replaceTeamPolicies({ id: team.id, policies: [policies[1].id], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(1)
        expect(team.policies).to.only.include([_.pick(policies[1], 'id', 'name', 'version')])
        done()
      })
    })
  })

  lab.test('add the same policy twice to a team', (done) => {

    teamOps.addTeamPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)
      expect(team.policies).to.only.include([
        _.pick(policies[0], 'id', 'name', 'version'),
        _.pick(policies[1], 'id', 'name', 'version')
      ])

      teamOps.addTeamPolicies({ id: team.id, policies: [policies[1].id], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(2)
        expect(team.policies).to.only.include([
          _.pick(policies[0], 'id', 'name', 'version'),
          _.pick(policies[1], 'id', 'name', 'version')
        ])
        done()
      })
    })
  })

  lab.test('delete team policies', (done) => {
    teamOps.addTeamPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)

      teamOps.deleteTeamPolicies({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([])
        done()
      })
    })
  })

  lab.test('delete specific team policy', (done) => {

    teamOps.addTeamPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)

      teamOps.deleteTeamPolicy({ teamId: team.id, policyId: policies[0].id, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([_.pick(policies[1], 'id', 'name', 'version')])

        done()
      })
    })
  })

  lab.test('add users to a team', (done) => {

    let userIds = [users[0].id]

    teamOps.addUsersToTeam({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: users[0].id,
          name: users[0].name
        }
      ])

      done()
    })
  })

  lab.test('replace users of a team', (done) => {

    let userIds = [users[0].id]

    teamOps.addUsersToTeam({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: users[0].id,
          name: users[0].name
        }
      ])

      userIds = [users[1].id]

      teamOps.replaceUsersInTeam({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.users).to.equal([
          {
            id: users[1].id,
            name: users[1].name
          }
        ])
        done()
      })
    })
  })

  lab.test('delete users of a team', (done) => {

    let userIds = [users[0].id, users[1].id]

    teamOps.addUsersToTeam({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: users[0].id,
          name: users[0].name
        },
        {
          id: users[1].id,
          name: users[1].name
        }
      ])

      teamOps.deleteTeamMembers({ id: team.id, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.not.exist()
        teamOps.readTeam({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          expect(team).to.exist()
          expect(team.users).to.equal([])
          done()
        })
      })
    })
  })

  lab.test('delete a specific user of a team', (done) => {
    let userIds = [users[0].id, users[1].id]

    teamOps.addUsersToTeam({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: users[0].id,
          name: users[0].name
        },
        {
          id: users[1].id,
          name: users[1].name
        }
      ])

      teamOps.deleteTeamMember({ id: team.id, userId: users[1].id, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.not.exist()

        teamOps.readTeam({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          expect(team).to.exist()
          expect(team.users).to.equal([{
            id: users[0].id,
            name: users[0].name
          }])
          done()
        })
      })
    })
  })

})
