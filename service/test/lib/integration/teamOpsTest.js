
'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const logger = require('pino')()

const TeamOps = require('../../../lib/teamOps')
const dbConn = require('../../../lib/dbConn')

const db = dbConn.create(logger)
const teamOps = TeamOps(db.pool, logger)

let testTeamId

lab.experiment('TeamOps', () => {
  lab.test('list of all teams', (done) => {
    teamOps.listAllTeams({}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(6)
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')

      done()
    })
  })

  lab.test('list of org teams', (done) => {
    teamOps.listOrgTeams(['WONKA'], (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(6)
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')

      done()
    })
  })

  lab.test('create, update and delete a team', (done) => {
    teamOps.createTeam(['Team 4', 'This is a test team', null, 'WONKA'], (err, result) => {
      testTeamId = result.id

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Team 4')

      teamOps.updateTeam([testTeamId, 'Team 5', 'description', [{'id': 1, 'name': 'Tom Watson'}, {'id': 2, 'name': 'Michael O\'Brien'}], [{'id': 1, 'name': 'Financial info access'}]], (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.name).to.equal('Team 5')

        teamOps.deleteTeamById([testTeamId], done)
      })
    })
  })

  lab.test('read a specific team', (done) => {
    teamOps.readTeamById([1], (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.users.length).to.equal(1)
      expect(result.policies.length).to.equal(1)

      done()
    })
  })
})
