
'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const crypto = require('crypto')

const testUtils = require('../utils')
const { udaru } = testUtils

const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

function randomId () {
  return crypto.randomBytes(2).toString('hex')
}

lab.experiment('TeamOps', () => {
  let testTeam
  let users
  let policies = []
  lab.before(done => {
    udaru.users.list({organizationId: 'WONKA'}, (err, fetchedUsers) => {
      expect(err).to.not.exist()
      expect(fetchedUsers).to.exist()
      expect(fetchedUsers.length).to.be.at.least(2)
      users = fetchedUsers

      udaru.policies.create({
        version: '1',
        name: randomId(),
        organizationId: 'WONKA',
        statements
      }, (err, createdPolicy) => {
        expect(err).to.not.exist()
        expect(createdPolicy).to.exist()
        policies.push(createdPolicy)

        udaru.policies.create({
          version: '1',
          name: randomId(),
          organizationId: 'WONKA',
          statements
        }, (err, createdPolicy) => {
          expect(err).to.not.exist()
          expect(createdPolicy).to.exist()
          policies.push(createdPolicy)

          udaru.policies.create({
            id: 'testPolicyId-1234',
            version: '1',
            name: randomId(),
            organizationId: 'ROOT',
            statements
          }, (err, createdPolicy) => {
            expect(err).to.not.exist()
            expect(createdPolicy).to.exist()
            policies.push(createdPolicy)
            done()
          })
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
    udaru.teams.create(testTeam, (err, result) => {
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
      udaru.teams.delete({id: testTeam.id, organizationId: 'WONKA'}, done)
      testTeam = null
    } else {
      done()
    }
  })

  lab.test('list of org teams', (done) => {
    udaru.teams.list({organizationId: 'WONKA'}, (err, result) => {
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
    udaru.teams.addUsers({id: testTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()

      userIds = [users[0].id, users[1].id]
      udaru.teams.addUsers({id: testTeam.id, organizationId: 'WONKA', users: userIds}, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.users.length).to.equal(2)

        udaru.teams.read({ id: testTeam.id, organizationId: 'WONKA' }, (err, readTeam) => {
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

    udaru.teams.update(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal(testTeam.name)
      expect(result.description).to.equal(testTeam.description)

      done()
    })
  })

  lab.test('create, update only the team description', (done) => {
    testTeam.description = '_d'

    udaru.teams.update(testTeam, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal(testTeam.name)
      expect(result.description).to.equal(testTeam.description)

      done()
    })
  })

  // TODO: Needs review
  lab.test('read a specific team', (done) => {
    udaru.teams.read({ id: '2', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Readers')
      expect(result.description).to.equal('General read-only access')
      expect(result.usersCount).to.equal(2)
      expect(result.usersCount).to.equal(result.users.length)
      expect(result.users.length).to.equal(2)
      expect(result.policies.length).to.equal(0)

      done()
    })
  })

  lab.test('read users from a specific team', (done) => {
    udaru.teams.listUsers({ id: '2', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.page).to.equal(1)
      expect(result.limit).to.greaterThan(1)
      expect(result.total).to.equal(2)
      expect(result.data.length).to.equal(2)
      expect(result.data).to.equal([
        { id: 'CharlieId', name: 'Charlie Bucket' },
        { id: 'VerucaId', name: 'Veruca Salt' }
      ])

      done()
    })
  })

  lab.test('paginated read users from a specific team', (done) => {
    udaru.teams.listUsers({ id: '2', page: 2, limit: 1, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.page).to.equal(2)
      expect(result.limit).to.equal(1)
      expect(result.total).to.equal(2)
      expect(result.data.length).to.equal(1)
      expect(result.data).to.equal([
        { id: 'VerucaId', name: 'Veruca Salt' }
      ])

      done()
    })
  })

  lab.test('creating a team should create a default admin policy', (done) => {
    udaru.policies.list({organizationId: 'WONKA'}, (err, policies) => {
      expect(err).to.not.exist()

      const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeam.id })
      expect(defaultPolicy).to.exist()

      udaru.policies.delete({ id: defaultPolicy.id, organizationId: 'WONKA' }, (err) => {
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

    udaru.teams.create(testTeam, {createOnly: true}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.exist()
      testTeam.id = result.id // afterEach will cleanup based on the ID

      udaru.policies.list({organizationId: 'WONKA'}, (err, policies) => {
        udaru.teams.delete(testTeam, (err) => { if (err) throw err })
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => {
          return p.name === 'Default Team Admin for ' + testTeam.id
        })
        expect(defaultPolicy).to.not.exist()
        done()
      })
    })
  })

  lab.test('creating a team with the same id should fail second time', (done) => {
    let testTeam = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'description',
      organizationId: 'WONKA'
    }

    udaru.teams.create(testTeam, {createOnly: true}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()

      udaru.teams.create(testTeam, {createOnly: true}, (err, result) => {
        expect(err).to.exist()
        expect(err.output.statusCode).to.equal(400)
        expect(err.message).to.match(/Team with id nearForm already present/)

        udaru.teams.delete(testTeam, done)
      })
    })
  })

  lab.test('create a team with long name should fail', (done) => {
    const teamName = Array(32).join('a')
    udaru.teams.create({ organizationId: 'WONKA', name: teamName, description: 'nearform description' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
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
      udaru.teams.delete(testTeam, () => {})
    }, 5000)

    udaru.teams.create(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()

      const defaultUser = team.users.find((u) => { return u.name === testTeam.user.name })
      expect(defaultUser).to.exist()

      udaru.users.read({ id: defaultUser.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()

        expect(user.name).to.be.equal(testTeam.user.name)

        const defaultPolicy = user.policies.find((p) => { return p.name === 'Default Team Admin for ' + team.id })
        expect(defaultPolicy).to.exist()

        udaru.teams.delete({ id: team.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.not.exist()

          udaru.users.delete({ id: user.id, organizationId: 'WONKA' }, done)
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
      udaru.teams.delete(testTeam, () => {})
    }, 5000)

    udaru.teams.create(testTeam, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()
      expect(team.users.length).to.equal(1)
      expect(team.users[0]).to.equal({ id: testTeam.user.id, name: testTeam.user.name })

      const defaultUser = team.users[0]

      udaru.users.read({ id: defaultUser.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()

        const defaultPolicy = user.policies.find((p) => { return p.name === 'Default Team Admin for ' + team.id })
        expect(defaultPolicy).to.exist()

        udaru.teams.delete({ id: team.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.not.exist()

          udaru.users.delete({ id: user.id, organizationId: 'WONKA' }, done)
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

    udaru.teams.create(childTeam, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.path).to.equal(testTeam.id + '.' + result.id)

      udaru.teams.delete({ id: result.id, organizationId: 'WONKA' }, done)
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

    udaru.teams.create(childTeam, (err, childTeam) => {
      expect(err).to.not.exist()
      expect(childTeam).to.exist()

      expect(childTeam.path).to.equal(testTeam.id + '.' + childTeam.id)

      udaru.teams.delete({ organizationId: 'WONKA', id: testTeam.id }, (err) => {
        expect(err).to.not.exist()
        testTeam = null // so that afterEach don't try to delete a team that was already deleted
        udaru.teams.read({ id: childTeam.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.exist()
          expect(err.isBoom).to.be.true()
          expect(err.message).to.match(/Team with id [a-zA-Z0-9_]+ could not be found/)
          done()
        })
      })
    })
  })

  lab.test('moveTeam should return an error if the moved team has invalid ID', (done) => {
    const id = 'InvalidMoveID'
    const parentId = 'InvalidParentMoveID'
    udaru.teams.move({ id: id, parentId: parentId, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()
      expect(err.message).to.include('Some teams')
      expect(err.message).to.include('were not found')
      expect(err.message).to.include(id)
      expect(err.message).to.include(parentId)

      done()
    })
  })

  lab.test('moveTeam should return an error if teams are from different orgs', (done) => {
    let childTeam = {
      id: 'childTeam',
      name: 'Team Child',
      description: 'This is a test team for paths',
      parentId: null,
      organizationId: 'ROOT'
    }

    udaru.teams.create(childTeam, (err, childTeam) => {
      expect(err).to.not.exist()
      expect(childTeam).to.exist()

      let testTeam2 = {
        id: 'TeamParent',
        name: 'Team Parent',
        description: 'This is a test team for paths',
        organizationId: 'WONKA'
      }
      udaru.teams.create(testTeam2, (err, testTeam2) => {
        expect(err).to.not.exist()
        expect(testTeam2).to.exist()

        udaru.teams.move({ id: childTeam.id, parentId: testTeam2.id, organizationId: 'WONKA' }, (err, result) => {
          expect(err).to.exist()
          expect(err.message).to.equal('Some teams [childTeam] were not found')

          udaru.teams.delete({ id: childTeam.id, organizationId: 'ROOT' }, (err, result) => {
            expect(err).to.not.exist()

            udaru.teams.delete({ id: testTeam2.id, organizationId: 'WONKA' }, done)
          })
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

    udaru.teams.create(childTeam, (err, childTeam) => {
      expect(err).to.not.exist()
      expect(childTeam).to.exist()

      let testTeam2 = {
        name: 'Team Parent',
        description: 'This is a test team for paths',
        organizationId: 'WONKA'
      }
      udaru.teams.create(testTeam2, (err, testTeam2) => {
        expect(err).to.not.exist()
        expect(testTeam2).to.exist()
        udaru.teams.move({ id: childTeam.id, parentId: testTeam2.id, organizationId: 'WONKA' }, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.path).to.equal(testTeam2.id + '.' + childTeam.id)

          udaru.teams.read({id: childTeam.id, organizationId: 'WONKA'}, (err, result) => {
            expect(err).to.not.exist()
            expect(result).to.exist()
            expect(result.path).to.equal(testTeam2.id + '.' + childTeam.id)

            udaru.teams.delete({id: testTeam2.id, organizationId: 'WONKA'}, done)
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

    udaru.teams.create(teamData, (err, result) => {
      expect(err).to.not.exist()

      const teamId = result.id

      expect(result.path).to.equal(testTeam.id + '.' + teamId)

      udaru.teams.move({ id: teamId, parentId: null, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.path).to.equal(teamId.toString())

        udaru.teams.delete({id: teamId, organizationId: 'WONKA'}, done)
      })
    })
  })

  lab.test('add policies from another org to team', (done) => {
    udaru.teams.addPolicies({ id: testTeam.id, policies: [policies[2].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.exist()
      expect(err.message).to.equal('Some policies [testPolicyId-1234] were not found')

      done()
    })
  })

  lab.test('add policies to team', (done) => {
    udaru.teams.addPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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
    udaru.teams.addPolicies({
      id: testTeam.id,
      organizationId: 'WONKA',
      policies: [policies[0].id]
    }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()

      udaru.teams.replacePolicies({ id: team.id, policies: [policies[1].id], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(1)
        expect(team.policies).to.only.include([_.pick(policies[1], 'id', 'name', 'version')])
        done()
      })
    })
  })

  lab.test('add the same policy twice to a team', (done) => {
    udaru.teams.addPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)
      expect(team.policies).to.only.include([
        _.pick(policies[0], 'id', 'name', 'version'),
        _.pick(policies[1], 'id', 'name', 'version')
      ])

      udaru.teams.addPolicies({ id: team.id, policies: [policies[1].id], organizationId: 'WONKA' }, (err, team) => {
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
    udaru.teams.addPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)

      udaru.teams.deletePolicies({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([])
        done()
      })
    })
  })

  lab.test('delete specific team policy', (done) => {
    udaru.teams.addPolicies({ id: testTeam.id, policies: [policies[0].id, policies[1].id], organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.have.length(2)

      udaru.teams.deletePolicy({ teamId: team.id, policyId: policies[0].id, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([_.pick(policies[1], 'id', 'name', 'version')])

        done()
      })
    })
  })

  lab.test('add users from another org to a team', (done) => {
    udaru.users.create({ id: 'testUserRoot', name: 'test', organizationId: 'ROOT' }, (err, user) => {
      expect(err).to.not.exist()

      let userIds = [user.id]

      udaru.teams.addUsers({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.exist()
        expect(err.message).to.equal('Some users [testUserRoot] were not found')

        udaru.users.delete(user, done)
      })
    })
  })

  lab.test('add users to a team', (done) => {
    let userIds = [users[0].id]

    udaru.teams.addUsers({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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

    udaru.teams.addUsers({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: users[0].id,
          name: users[0].name
        }
      ])

      userIds = [users[1].id]

      udaru.teams.replaceUsers({ id: team.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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

    udaru.teams.addUsers({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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

      udaru.teams.deleteMembers({ id: team.id, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.not.exist()
        udaru.teams.read({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
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

    udaru.teams.addUsers({ id: testTeam.id, users: userIds, organizationId: 'WONKA' }, (err, team) => {
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

      udaru.teams.deleteMember({ id: team.id, userId: users[1].id, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.not.exist()

        udaru.teams.read({ id: team.id, organizationId: 'WONKA' }, (err, team) => {
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
