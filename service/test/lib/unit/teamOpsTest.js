'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const TeamOps = require('../../../lib/teamOps')
const utils = require('../../utils')

const teamData = {
  id: 1,
  name: 'test',
  description: 'description',
  users: [],
  policies: [],
  organizationId: 'WONKA'
}


lab.experiment('teamOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var teamOps = TeamOps(utils.getDbPollConnectionError(), () => {})
    var functionsUnderTest = {
      'listOrgTeams': ['WONKA'],
      'createTeam': [{name: 'name', description: 'description'}],
      'readTeam': [{ id: 1, organizationId: 'WONKA' }]
    }
    var tasks = []

    Object.keys(functionsUnderTest).forEach((func) => {
      tasks.push((cb) => {
        const params = functionsUnderTest[func]
        params.push(utils.testError(expect, 'Error: connection error test', cb))
        teamOps[func].apply(teamOps, functionsUnderTest[func])
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the first db query fails', (done) => {
    var teamOps = TeamOps(utils.getDbPollFirstQueryError(), () => {})
    var functionsUnderTest = {
      'listOrgTeams': ['WONKA'],
      'createTeam': [{name: 'name', description: 'description'}],
      'readTeam': [{ id: 1, organizationId: 'WONKA' }]
    }
    var tasks = []

    Object.keys(functionsUnderTest).forEach((func) => {
      tasks.push((cb) => {
        const params = functionsUnderTest[func]
        params.push(utils.testError(expect, 'Error: query error test', cb))
        teamOps[func].apply(teamOps, functionsUnderTest[func])
      })
    })

    async.series(tasks, done)
  })

  lab.test('updateTeam should return an error if db transaction fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam(teamData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if updating name and description fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE teams', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam(teamData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if updating name and description returns rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam(teamData, utils.testError(expect, 'Not Found', done))
  })

  lab.test('updateTeam should return an error if deleting team members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam(teamData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if inserting team members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamData.users = [{ id: 1 }]

    teamOps.updateTeam(teamData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateTeam should return an error if commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.updateTeam(teamData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteTeam should return an error if the transaction fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var teamOps = TeamOps(dbPool, () => {})

    teamOps.deleteTeam({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readTeam should return an error if selecting the team data return rowcount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, undefined, {rowCount: 0})
    var teamOps = TeamOps(dbPool, {debug: () => {}})

    teamOps.readTeam({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Not Found', done))
  })

  lab.test('readTeam should return an error if selecting the team members data fails', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb = cb || params
        sql = (sql.text || sql).trim()
        if (sql.text || sql.startsWith('SELECT id, name')) {
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

    teamOps.readTeam({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readTeam should return an error if selecting the policies data fails', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb = cb || params
        sql = (sql.text || sql).trim()
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

    teamOps.readTeam({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })
})
