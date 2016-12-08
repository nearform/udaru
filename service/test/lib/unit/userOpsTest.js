'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const UserOps = require('../../../lib/userOps')
const utils = require('../../utils')

lab.experiment('userOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var userOps = UserOps(utils.getDbPollConnectionError(), {debug: () => {}})
    var functionsUnderTest = ['listAllUsers', 'listOrgUsers', 'createUser', 'createUserById', 'readUserById', 'updateUser', 'deleteUserById', 'getUserByToken']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        userOps[f]([1, 'test', [], []], utils.testError(expect, 'Error: connection error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the first db query fails', (done) => {
    var userOps = UserOps(utils.getDbPollFirstQueryError(), {debug: () => {}})
    var functionsUnderTest = ['listAllUsers', 'listOrgUsers', 'createUser', 'createUserById', 'readUserById', 'getUserByToken']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        userOps[f]([], utils.testError(expect, 'Error: query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('readUserById should return an error if the team cannot be retrieved', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT teams.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.readUserById([], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readUserById should return an error if the policies cannot be retrieved', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT pol.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.readUserById([], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the transaction cannot be started', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the update query fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE users', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the delete query on team_members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the insert query on team_members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [1], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the delete query on user_policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the insert query on team_members fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO user_policies', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], [1]], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserById should return an error if the transaction cannot be started', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserById should return an error if deleting from user policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from user_policies', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserById should return an error if deleting from team memebers fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from team_members', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserById should return an error if deleting from users fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from users', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1, 'test', [], []], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserById should return an error if deleting from users returns a rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1, 'test', [], []], utils.testError(expect, 'Not Found', done))
  })

  lab.test('deleteUserById should return an error if commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('getUserByToken should return an error if selecting from users returns a rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, undefined, {rowCount: 0})
    var userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserById([1, 'test', [], []], utils.testError(expect, 'Not Found', done))
  })
})
