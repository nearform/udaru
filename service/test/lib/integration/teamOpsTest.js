
'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const teamOps = require('../../../lib/ops/teamOps')
const policyOps = require('../../../lib/ops/policyOps')
const userOps = require('../../../lib/ops/userOps')

const updateData = {
  name: 'Team 5',
  description: 'description',
  organizationId: 'WONKA'
}
const updateTeamMembersData = {
  users: ['MikeId', 'CharlieId'],
  organizationId: 'WONKA'
}


lab.experiment('TeamOps', () => {

  let testTeamData = {
    name: 'Team 4',
    description: 'This is a test team',
    parentId: null,
    organizationId: 'WONKA'
  }
  let wonkaTeams
  let wonkaPolicies
  
  lab.before((done) => {
    teamOps.createTeam(testTeamData, function (err, result) {
      testTeamData.id = result.id

      expect(err).to.not.exist()
      expect(result).to.exist()

      done()

    })
  })

  const initialData = _.clone(testTeamData)
  lab.afterEach((done) => {
    const membersData = _.clone(updateTeamMembersData)
    initialData.id = testTeamData.id
    membersData.id = testTeamData.id

    teamOps.updateTeam(initialData, (err, result) => {
      expect(err).to.not.exist()

      teamOps.replaceUsersInTeam(membersData, (err, result) => {
        expect(err).to.not.exist()

        done()
      })
    })
  })

  lab.after((done) => {
    teamOps.deleteTeam({ id: testTeamData.id, organizationId: 'WONKA' }, function (err) {
      //expect(err).to.not.exist()
      if(err) console.error(err)

      // check default policy has been deleted
      policyOps.listByOrganization({ organizationId: 'WONKA' }, (err, policies) => {
        if(err) console.error(err)
        //expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeamData.id })
        expect(defaultPolicy).to.not.exist()
        done()
      })
    })
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
        'Company Lawyer',
        testTeamData.name
      ]
      expect(_.map(result, 'name')).contains(expectedTeamIds)

      done()
    })
  })

  lab.test('create a team', (done) => {
    updateData.id = testTeamData.id

    teamOps.updateTeam(updateData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Team 5')

      policyOps.listByOrganization({ organizationId: 'WONKA' }, (err, policies) => {
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeamData.id })
        expect(defaultPolicy).to.exist()

        done()
      })
    })
  })

  lab.test('Add twice the same user to a team', (done) => {
    updateData.id = testTeamData.id
    updateData.users = ['MikeId', 'MikeId', 'CharlieId']

    teamOps.updateTeam(updateData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Team 5')

      done()
    })
  })

  lab.test('create, update only the team name', (done) => {
    const updateData = {
      id: testTeamData.id,
      name: 'Team 5',
      organizationId: 'WONKA'
    }

    teamOps.updateTeam(updateData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Team 5')
      expect(result.description).to.equal(testTeamData.description)

      done()
    })
  })

  lab.test('create, update only the team description', (done) => {
    const updateData = {
      id: testTeamData.id,
      description: 'new desc',
      organizationId: 'WONKA'
    }

    teamOps.updateTeam(updateData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.description).to.equal('new desc')
      expect(result.name).to.equal(testTeamData.name)

      done()
    })
  })

  lab.test('read a specific team', (done) => {
    teamOps.readTeam({ id: testTeamData.id, organizationId: 'WONKA' }, (err, result) => {

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.users.length).to.equal(2)
      expect(result.policies.length).to.equal(1)

      done()
    })
  })

  lab.test('creating a team should create a default admin policy', (done) => {
    delete testTeamData.id
    teamOps.createTeam(testTeamData, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()

      policyOps.listByOrganization({organizationId: 'WONKA'}, (err, policies) => {
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + result.id })
        expect(defaultPolicy).to.exist()

        policyOps.deletePolicy({ id: defaultPolicy.id, organizationId: 'WONKA' }, (err) => {
          expect(err).to.not.exist()

          teamOps.deleteTeam({ id: result.id, organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('creating a team with createOnly option should not create a default admin policy', (done) => {
    teamOps.createTeam(testTeamData, { createOnly: true }, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()

      policyOps.listByOrganization({organizationId: 'WONKA'}, (err, policies) => {
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => {
          return p.name === 'Default Team Admin for ' + result.id
        })
        expect(defaultPolicy).to.not.exist()

        teamOps.deleteTeam({ id: result.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('create team support creation of default team admin user', (done) => {
    testTeamData.user = { name: 'Team 6 Admin' }

    teamOps.createTeam(testTeamData, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()

      const defaultUser = team.users.find((u) => { return u.name === 'Team 6 Admin' })
      expect(defaultUser).to.exist()

      userOps.readUser({ id: defaultUser.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()

        expect(user.name).to.be.equal('Team 6 Admin')

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
    testTeamData.user = { name: 'Team 6 Admin', id: 'testAdminId' }

    teamOps.createTeam(testTeamData, function (err, team) {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.exist()
      expect(team.users.length).to.equal(1)
      expect(team.users[0]).to.equal({ id: 'testAdminId', name: 'Team 6 Admin' })

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
    const teamData = {
      name: 'Team Child',
      description: 'This is a test team for paths',
      parentId: '1',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(teamData, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.path).to.equal('1.' + result.id)

      teamOps.deleteTeam({ id: result.id, organizationId: 'WONKA' }, done)
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
    const teamData = {
      name: 'Team Parent',
      description: 'This is a test team for paths',
      parentId: '1',
      organizationId: 'WONKA'
    }

    teamOps.createTeam(teamData, (err, result) => {
      expect(err).to.not.exist()

      const teamId = result.id

      expect(result.path).to.equal('1.' + teamId)

      teamOps.moveTeam({ id: teamId, parentId: null, organizationId: 'WONKA' }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.path).to.equal(teamId.toString())

        teamOps.deleteTeam({id: teamId, organizationId: 'WONKA'}, done)
      })
    })
  })

  lab.test('replace team policies', (done) => {
    teamOps.readTeam({ id: '1', organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }])

      teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId2', 'policyId3'], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(2)
        expect(team.policies).to.only.include([{ id: 'policyId2', name: 'Accountant', version: '0.1' }, { id: 'policyId3', name: 'Sys admin', version: '0.1' }])

        teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies to team', (done) => {
    teamOps.readTeam({ id: '1', organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }])

      teamOps.addTeamPolicies({ id: '1', policies: ['policyId2', 'policyId3'], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(3)
        expect(team.policies).to.only.include([
          { id: 'policyId1', name: 'Director', version: '0.1' },
          { id: 'policyId2', name: 'Accountant', version: '0.1' },
          { id: 'policyId3', name: 'Sys admin', version: '0.1' }
        ])

        teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add the same policy twice to a team', (done) => {
    teamOps.readTeam({ id: '1', organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }])

      teamOps.addTeamPolicies({ id: '1', policies: ['policyId1', 'policyId2', 'policyId3'], organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.have.length(3)
        expect(team.policies).to.only.include([
          { id: 'policyId1', name: 'Director', version: '0.1' },
          { id: 'policyId2', name: 'Accountant', version: '0.1' },
          { id: 'policyId3', name: 'Sys admin', version: '0.1' }
        ])

        teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete team policies', (done) => {
    teamOps.readTeam({ id: '1', organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }])

      teamOps.deleteTeamPolicies({ id: '1', organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([])

        teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete specific team policy', (done) => {
    teamOps.readTeam({ id: '1', organizationId: 'WONKA' }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }])

      teamOps.deleteTeamPolicy({ teamId: '1', policyId: 'policyId1', organizationId: 'WONKA' }, (err, team) => {
        expect(err).to.not.exist()
        expect(team).to.exist()
        expect(team.policies).to.equal([])

        teamOps.replaceTeamPolicies({ id: '1', policies: ['policyId1'], organizationId: 'WONKA' }, (err, team) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add users to a team', (done) => {
    const id = 1
    const users = ['WillyId']
    const organizationId = 'WONKA'

    teamOps.addUsersToTeam({ id, users, organizationId }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: 'AugustusId',
          name: 'Augustus Gloop'
        },
        {
          id: 'WillyId',
          name: 'Willy Wonka'
        }
      ])

      teamOps.replaceUsersInTeam({ id, users: ['AugustusId'], organizationId }, done)
    })
  })

  lab.test('replace users of a team', (done) => {
    const id = 1
    const users = ['WillyId']
    const organizationId = 'WONKA'

    teamOps.replaceUsersInTeam({ id, users, organizationId }, (err, team) => {
      expect(err).to.not.exist()
      expect(team).to.exist()
      expect(team.users).to.equal([
        {
          id: 'WillyId',
          name: 'Willy Wonka'
        }
      ])

      teamOps.replaceUsersInTeam({ id, users: ['AugustusId'], organizationId }, done)
    })
  })

  lab.test('delete users of a team', (done) => {
    const id = 1
    const organizationId = 'WONKA'

    teamOps.deleteTeamMembers({ id, organizationId }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.not.exist()

      teamOps.replaceUsersInTeam({ id, users: ['AugustusId'], organizationId }, done)
    })
  })

  lab.test('delete users of a team', (done) => {
    const id = 2
    const userId = 'CharlieId'
    const organizationId = 'WONKA'

    teamOps.deleteTeamMember({ id, userId, organizationId }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.not.exist()

      teamOps.replaceUsersInTeam({ id, users: ['CharlieId', 'VerucaId'], organizationId }, done)
    })
  })

})
