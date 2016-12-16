
'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const logger = require('pino')()

const TeamOps = require('../../../lib/teamOps')
const PolicyOps = require('../../../lib/policyOps')
const UserOps = require('../../../lib/userOps')
const dbConn = require('../../../lib/dbConn')

const db = dbConn.create(logger)
const teamOps = TeamOps(db.pool, logger)
const policyOps = PolicyOps(db.pool, logger)
const userOps = UserOps(db.pool, logger)

let testTeamId
const teamData = {
  name: 'Team 4',
  description: 'This is a test team',
  parentId: null,
  organizationId: 'WONKA'
}

lab.experiment('TeamOps', () => {

  lab.test('list of org teams', (done) => {
    teamOps.listOrgTeams({organizationId: 'WONKA'}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(6)
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')

      done()
    })
  })

  lab.test('create, update and delete a team', (done) => {
    teamOps.createTeam(teamData, function (err, result) {
      testTeamId = result.id

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Team 4')

      const updateData = {
        id: testTeamId,
        name: 'Team 5',
        description: 'description',
        users: [{'id': 1, 'name': 'Tom Watson'}, {'id': 2, 'name': 'Michael O\'Brien'}],
        policies: [{'id': 1, 'name': 'Financial info access'}],
        organizationId: 'WONKA'
      }

      teamOps.updateTeam(updateData, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.name).to.equal('Team 5')

        policyOps.listByOrganization({ organizationId: 'WONKA' }, (err, policies) => {
          expect(err).to.not.exist()

          const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeamId })
          expect(defaultPolicy).to.exist()

          teamOps.deleteTeam({ id: testTeamId, organizationId: 'WONKA' }, function (err) {
            expect(err).to.not.exist()

            // check default policy has been deleted
            policyOps.listByOrganization({ organizationId: 'WONKA' }, (err, policies) => {
              expect(err).to.not.exist()

              const defaultPolicy = policies.find((p) => { return p.name === 'Default Team Admin for ' + testTeamId })
              expect(defaultPolicy).to.not.exist()
              done()
            })
          })
        })
      })
    })
  })

  lab.test('read a specific team', (done) => {
    teamOps.readTeam({ id: 1, organizationId: 'WONKA' }, (err, result) => {

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.users.length).to.equal(1)
      expect(result.policies.length).to.equal(1)

      done()
    })
  })

  lab.test('creating a team should create a default admin policy', (done) => {
    teamOps.createTeam(teamData, function (err, result) {
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
    teamOps.createTeam(teamData, { createOnly: true }, function (err, result) {
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
    teamData.user = { name: 'Team 6 Admin' }

    teamOps.createTeam(teamData, function (err, team) {
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

})
