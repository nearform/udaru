
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


  lab.test('create a team', (done) => {
    testTeam = {
      name: 'test::teamOps:createTeam:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }
    teamOps.createTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()
      testTeam.id = result.id // afterEach will delete this team
      expect(result.name).to.equal(testTeam.name)

      done()
    })
  })

  lab.test('Add twice the same user to a team', (done) => {
    testTeam = {
      name: 'test::teamOps:multiUsers:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, (err, createdTeam) => {
      expect(err).to.not.exist()
      expect(createdTeam).to.exist()

      testTeam.id = createdTeam.id // afterEach will delete this team

      let userIds = [users[0].id]
      teamOps.addUsersToTeam({id: createdTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()

        userIds = [users[0].id, users[1].id]
        teamOps.addUsersToTeam({id: createdTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.users.length).to.equal(2)

          teamOps.readTeam({ id: createdTeam.id, organizationId: 'WONKA' }, (err, readTeam) => {

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
  })

  lab.test('create, update only the team name', (done) => {
    testTeam = {
      name: 'test::teamOps:update:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, (err, createdTeam) => {
      expect(err).to.not.exist()
      expect(createdTeam).to.exist()

      testTeam.id = createdTeam.id // afterEach will delete this team

      createdTeam.name = testTeam.name = testTeam.name + randomId()

      teamOps.updateTeam(createdTeam, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.name).to.equal(testTeam.name)
        expect(result.description).to.equal(testTeam.description)

        done()
      })
    })
  })

  lab.test('create, update only the team description', (done) => {
    testTeam = {
      name: 'test::teamOps:update:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, (err, createdTeam) => {
      expect(err).to.not.exist()
      expect(createdTeam).to.exist()

      testTeam.id = createdTeam.id // afterEach will delete this team

      createdTeam.description = testTeam.description = randomId()

      teamOps.updateTeam(createdTeam, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.name).to.equal(testTeam.name)
        expect(result.description).to.equal(testTeam.description)

        done()
      })
    })
  })

  lab.test('read a specific team', (done) => {
    testTeam = {
      name: 'test::teamOps:read:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }
    teamOps.createTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()

      testTeam.id = result.id // afterEach will delete this team

      expect(result.name).to.equal(testTeam.name)
      teamOps.readTeam({ id: testTeam.id, organizationId: 'WONKA' }, (err, result) => {

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.name).to.equal(testTeam.name)
        expect(result.description).to.equal(testTeam.description)

        done()
      })
    })
  })

  lab.test('creating a team should create a default admin policy', (done) => {
    testTeam = {
      name: 'test::teamOps:dfltPol:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }
    teamOps.createTeam(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()

      testTeam.id = result.id // afterEach will delete this team

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
  })

  lab.test('creating a team with createOnly option should not create a default admin policy', (done) => {
    testTeam = {
      name: 'test::teamOps:+Only:' + randomId(),
      description: 'description',
      organizationId: 'WONKA'
    }
    teamOps.createTeam(testTeam, { createOnly: true }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()

      testTeam.id = result.id // afterEach will delete this team

      policyOps.listByOrganization({organizationId: 'WONKA'}, (err, policies) => {
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => {
          return p.name === 'Default Team Admin for ' + result.id
        })
        expect(defaultPolicy).to.not.exist()
        done()
      })
    })
  })

  lab.test('create team support creation of default team admin user', (done) => {
    let teamId = randomId()
    testTeam = {
      name: 'test::teamOps:+Only:' + teamId,
      description: 'description',
      organizationId: 'WONKA',
      user: { name: 'test:' + teamId }
    }

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
    testTeam = {
      name: 'test::teamOps:+Only:' + teamId,
      description: 'description',
      organizationId: 'WONKA',
      user: { name: 'test:' + teamId, id: 'test:' + teamId }
    }

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

    testTeam = {
      name: 'test:team:parent:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, parentTeam) {
      expect(err).to.not.exist()
      expect(parentTeam).to.exist()
      testTeam.id = parentTeam.id


      const teamData = {
        name: 'test:team:parent:' + randomId(),
        description: 'child',
        parentId: parentTeam.id,
        organizationId: 'WONKA'
      }

      teamOps.createTeam(teamData, function (err, result) {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.path).to.equal(parentTeam.id + '.' + result.id)

        teamOps.deleteTeam({ id: result.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('deleteTeam should also delete descendants', (done) => {
    const parentData = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'WONKA'
    }
    const childData = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'WONKA'
    }

    teamOps.createTeam(parentData, (err, result) => {
      expect(err).to.not.exist()

      const parentId = result.id
      childData.parentId = parentId

      teamOps.createTeam(childData, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()

        const childId = result.id

        expect(result.path).to.equal(parentId + '.' + childId)

        teamOps.deleteTeam({ organizationId: 'WONKA', id: parentId }, (err) => {
          expect(err).to.not.exist()

          teamOps.readTeam({ id: childId, organizationId: 'WONKA' }, (err) => {
            expect(err).to.exist()
            expect(err.isBoom).to.be.true()
            expect(err.message).to.match(/Team with id [a-zA-Z0-9_]+ could not be found/)
            done()
          })
        })
      })
    })
  })

  lab.test('moveTeam should update path', (done) => {
    const parentData = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'WONKA'
    }
    const childData = {
      name: 'Team Child',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'WONKA'
    }

    teamOps.createTeam(parentData, (err, result) => {
      expect(err).to.not.exist()

      const parentId = result.id
      childData.parentId = parentId

      teamOps.createTeam(childData, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()

        const childId = result.id

        teamOps.moveTeam({ id: parentId, parentId: '3', organizationId: 'WONKA' }, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.path).to.equal('3.' + parentId)

          teamOps.readTeam({id: childId, organizationId: 'WONKA'}, (err, result) => {
            expect(err).to.not.exist()
            expect(result).to.exist()
            expect(result.path).to.equal('3.' + parentId + '.' + childId)

            teamOps.deleteTeam({id: parentId, organizationId: 'WONKA'}, done)
          })
        })
      })
    })
  })

  lab.test('un-nest team', (done) => {

    testTeam = {
      name: 'test:team:unnest:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, parentTeam) {
      expect(err).to.not.exist()
      expect(parentTeam).to.exist()
      testTeam.id = parentTeam.id

      const teamData = {
        name: 'Team Parent',
        description: 'This is a test team for paths',
        parentId: parentTeam.id,
        organizationId: 'WONKA'
      }

      teamOps.createTeam(teamData, (err, result) => {
        expect(err).to.not.exist()

        const teamId = result.id

        expect(result.path).to.equal(parentTeam.id + '.' + teamId)

        teamOps.moveTeam({ id: teamId, parentId: null, organizationId: 'WONKA' }, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.path).to.equal(teamId.toString())

          teamOps.deleteTeam({id: teamId, organizationId: 'WONKA'}, done)
        })
      })
    })
  })

  lab.test('add policies to team', (done) => {

    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      teamOps.addTeamPolicies({ id: team.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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

  lab.test('replace team policies', (done) => {

    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      teamOps.addTeamPolicies({
        id: team.id,
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
  })

  lab.test('add the same policy twice to a team', (done) => {

    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      teamOps.addTeamPolicies({ id: team.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(2)
        expect(team.policies).to.only.include([
          _.pick(policies[0], 'id', 'name', 'version'),
          _.pick(policies[1], 'id', 'name', 'version')
        ])

        teamOps.addTeamPolicies({ id: team.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('delete team policies', (done) => {

    testTeam = {
      name: 'test:team:-policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      teamOps.addTeamPolicies({ id: team.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('delete specific team policy', (done) => {

    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      teamOps.addTeamPolicies({ id: team.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('add users to a team', (done) => {

    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      let userIds = [users[0].id]

      teamOps.addUsersToTeam({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('replace users of a team', (done) => {
    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      let userIds = [users[0].id]

      teamOps.addUsersToTeam({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('delete users of a team', (done) => {
    testTeam = {
      name: 'test:team:-+policies:' + randomId(),
      description: 'parent',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      let userIds = [users[0].id, users[1].id]

      teamOps.addUsersToTeam({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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
  })

  lab.test('delete a specific user of a team', (done) => {
    testTeam = {
      name: 'test:team:-user:' + randomId(),
      description: '',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      testTeam.id = team.id

      let userIds = [users[0].id, users[1].id]

      teamOps.addUsersToTeam({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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

})
