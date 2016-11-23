
'use strict'

const mu = require('mu')()
const test = require('tap').test
const service = require('../../lib/service')
const TeamOps = require('../../lib/teamOps')
const utils = require('../utils')

let testTeamId

var opts = {
  logLevel: 'warn',
  mu
}

test('service starts and stops', (t) => {
  t.plan(1)
  service(opts, (svc) => {
    svc.destroy({}, (err, result) => {
      t.error(err)
    })
  })
})

test('list of all teams', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.listAllTeams({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('list of org teams', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.listOrgTeams([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('create a team', (t) => {
  t.plan(4)
  service(opts, (svc) => {
    svc.createTeam(['Team 4', 'This is a test team', null, 'WONKA'], (err, result) => {
      testTeamId = result.id

      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.name, 'Team 4', 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific team', (t) => {
  t.plan(6)
  service(opts, (svc) => {
    svc.readTeamById([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.id, 1, 'data should be as expected')
      t.deepEqual(result.users.length, 1, 'data should be as expected')
      t.deepEqual(result.policies.length, 1, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('update a team', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.updateTeam([testTeamId, 'Team 5', 'description', [{'id': 1, 'name': 'Tom Watson'}, {'id': 2, 'name': 'Michael O\'Brien'}], [{'id': 1, 'name': 'Financial info access'}]], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('delete a team', (t) => {
  t.plan(2)
  service(opts, (svc) => {
    svc.deleteTeamById([testTeamId], (err, result) => {
      t.error(err, 'should be no error')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('should return an error if the db connection fails', (t) => {
  t.plan(18)
  var teamOps = TeamOps(utils.getDbPollConnectionError(), mu, () => {})
  var functionsUnderTest = ['listAllTeams', 'listOrgTeams', 'createTeam', 'readTeamById', 'updateTeam', 'deleteTeamById']

  functionsUnderTest.forEach((f) => {
    teamOps[f]([1, 'test', 'description', [], []], utils.testError(t, 'Error: connection error test'))
  })
})

test('should return an error if the first db query fails', (t) => {
  t.plan(12)
  var teamOps = TeamOps(utils.getDbPollFirstQueryError(), mu, () => {})
  var functionsUnderTest = ['listAllTeams', 'listOrgTeams', 'createTeam', 'readTeamById']

  functionsUnderTest.forEach((f) => {
    teamOps[f]([1, 'test', 'description', [], []], utils.testError(t, 'Error: query error test'))
  })
})

test('updateTeam should return an error if users is not an array', (t) => {
  t.plan(3)
  var dbPool = {}
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description'], utils.testError(t, 'Bad Request'))
})

test('updateTeam should return an error if policies is not an array', (t) => {
  t.plan(3)
  var dbPool = {}
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', []], utils.testError(t, 'Bad Request'))
})

test('updateTeam should return an error if db transaction fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if updating name and description fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE teams', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if updating name and description returns rowCount 0', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, t: t}, {rowCount: 0})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(t, 'Not Found'))
})

test('updateTeam should return an error if deleting team members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if inserting team members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if deleting team policies fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_policies', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if inserting team policies fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_policies', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(t, 'Error: query error test'))
})

test('updateTeam should return an error if commit fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.updateTeam([1, 'test', 'description', [{}], [{}]], utils.testError(t, 'Error: query error test'))
})

test('deleteTeamById should return an error if the transaction fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.deleteTeamById([1], utils.testError(t, 'Error: query error test'))
})

test('deleteTeamById should return an error if deliting team members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from team_members', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.deleteTeamById([1], utils.testError(t, 'Error: query error test'))
})

test('deleteTeamById should return an error if deliting team policies fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from team_policies', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.deleteTeamById([1], utils.testError(t, 'Error: query error test'))
})

test('deleteTeamById should return an error if deliting team fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from teams', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.deleteTeamById([1], utils.testError(t, 'Error: query error test'))
})

test('deleteTeamById should return an error if deliting team return rowCount 0', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, t: t}, {rowCount: 0})
  var teamOps = TeamOps(dbPool, mu, () => {})

  teamOps.deleteTeamById([1], utils.testError(t, 'Not Found'))
})

test('deleteTeamById should return an error if commit fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, t: t})
  var teamOps = TeamOps(dbPool, mu, {debug: () => {}})

  teamOps.deleteTeamById([1], utils.testError(t, 'Error: query error test'))
})

test('readTeamById should return an error if selecting the team data return rowcount 0', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, undefined, {rowCount: 0})
  var teamOps = TeamOps(dbPool, mu, {debug: () => {}})

  teamOps.readTeamById([testTeamId], utils.testError(t, 'Not Found'))
})

test('readTeamById should return an error if selecting the team members data fails', (t) => {
  t.plan(3)
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
  var teamOps = TeamOps(dbPool, mu, {debug: () => {}})

  teamOps.readTeamById([testTeamId], utils.testError(t, 'Error: query error test'))
})

test('readTeamById should return an error if selecting the policies data fails', (t) => {
  t.plan(3)
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
  var teamOps = TeamOps(dbPool, mu, {debug: () => {}})

  teamOps.readTeamById([testTeamId], utils.testError(t, 'Error: query error test'))
})
