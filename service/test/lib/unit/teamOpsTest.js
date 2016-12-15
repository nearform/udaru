'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const TeamOps = require('../../../lib/teamOps')
const utils = require('../../utils')

lab.experiment('teamOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var teamOps = TeamOps(utils.getDbPollConnectionError(), () => {})
    var functionsUnderTest = ['listAllTeams', 'listOrgTeams', 'createTeam', 'readTeamById', 'updateTeam', 'deleteTeamById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        teamOps[f]([1, 'test', 'description', [], []], utils.testError(expect, 'Error: connection error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the first db query fails', (done) => {
    var teamOps = TeamOps(utils.getDbPollFirstQueryError(), () => {})
    var functionsUnderTest = ['listAllTeams', 'listOrgTeams', 'createTeam', 'readTeamById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        teamOps[f]([1, 'test', 'description', [], []], utils.testError(expect, 'Error: query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('updateTeam should return an error if db transaction fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if updating name and description fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE teams', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if updating name and description returns rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(expect, 'Not Found', done))
  })

  lab.test('updateTeam should return an error if deleting team members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if inserting team members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if deleting team policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_policies', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if inserting team policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_policies', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteTeamById should return an error if the transaction fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.deleteTeamById([1], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readTeamById should return an error if selecting the team data return rowcount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, undefined, {rowCount: 0})
    var teamOps = TeamOps(dbPool, {debug: () => {}})

    teamOps.readTeamById([1], utils.testError(expect, 'Not Found', done))
  })

  lab.test('readTeamById should return an error if selecting the team members data fails', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb = cb || params
        if (sql.startsWith('SELECT id, name')) {
          return cb(undefined, {rowCount: 1, rows: [{id: 1, name: 'filo', description: 'description'}]})
        }
        if (sql.startsWith('SELECT users.id')) {
          return cb(new Error('query error test'))
        }
        cb(undefined, {rowCount: 1, rows: []})
      }}
      cb(undefined, client, () => {})
    }}
    var teamOps = TeamOps(dbPool, {debug: () => {}})

    teamOps.readTeamById([1], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readTeamById should return an error if selecting the policies data fails', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb = cb || params
        if (sql.startsWith('SELECT id, name')) {
          return cb(undefined, {rowCount: 1, rows: [{id: 1, name: 'filo', description: 'description'}]})
        }
        if (sql.startsWith('SELECT pol.id, pol.name')) {
          return cb(new Error('query error test'))
        }
        cb(undefined, {rowCount: 1, rows: []})
      }}
      cb(undefined, client, () => {})
    }}
    var teamOps = TeamOps(dbPool, {debug: () => {}})

    teamOps.readTeamById([1], utils.testError(expect, 'Error: query error test', done))
  })
})
