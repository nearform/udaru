'use strict'

const mu = require('mu')()
const test = require('tap').test
const service = require('../../lib/service')
const UserOps = require('../../lib/userOps')
const utils = require('../utils')

var opts = {
  logLevel: 'warn',
  mu
}

test('list of all users', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.listAllUsers({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // console.log(result)
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('list of org users', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.listOrgUsers([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('create and delete a user by ID', (t) => {
  t.plan(5)
  service(opts, (svc) => {
    svc.createUserById([99, 'Mike Teavee', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result, { id: 99, name: 'Mike Teavee', teams: [], policies: [] }, 'data should be as expected')
      // delete the user again, as we don't need it
      svc.deleteUserById([99], (err, result) => {
        t.error(err, 'should be no error')

        svc.destroy({}, (err, result) => {
          t.error(err)
        })
      })
    })
  })
})

test('create a user (and delete it)', (t) => {
  t.plan(5)
  service(opts, (svc) => {
    svc.createUser(['Grandma Josephine', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.name, 'Grandma Josephine', 'data should be as expected')
      // delete the user again, as we don't need it
      svc.deleteUserById([result.id], (err, result) => {
        t.error(err, 'should be no error')

        svc.destroy({}, (err, result) => {
          t.error(err)
        })
      })
    })
  })
})

test('update a user', (t) => {
  const data = [6, 'Augustus Gloop', [{'id': 4, 'name': 'Dream Team'}], [{'id': 1, 'name': 'DROP ALL TABLES!'}, { 'id': 2, 'name': 'THROW DESK' }]]
  t.plan(3)
  service(opts, (svc) => {
    svc.updateUser(data, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific user', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.readUserById([3], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // t.deepEqual(result, [{ id: 99, name: 'Augustus Gloop' }], 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific user that does not exist', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.readUserById([987654321], (err, result) => {
      t.equal(err.output.statusCode, 404)
      t.notOk(result, 'result should not be supplied')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific user by token', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.getUserByToken(1, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // t.deepEqual(result, [{ id: 99, name: 'Augustus Gloop' }], 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('should return an error if the db connection fails', (t) => {
  t.plan(24)
  var userOps = UserOps(utils.getDbPollConnectionError(), mu, {debug: () => {}})
  var functionsUnderTest = ['listAllUsers', 'listOrgUsers', 'createUser', 'createUserById', 'readUserById', 'updateUser', 'deleteUserById', 'getUserByToken']

  functionsUnderTest.forEach((f) => {
    userOps[f]([1, 'test', [], []], utils.testError(t, 'Error: connection error test'))
  })
})

test('should return an error if the first db query fails', (t) => {
  t.plan(18)
  var userOps = UserOps(utils.getDbPollFirstQueryError(), mu, {debug: () => {}})
  var functionsUnderTest = ['listAllUsers', 'listOrgUsers', 'createUser', 'createUserById', 'readUserById', 'getUserByToken']

  functionsUnderTest.forEach((f) => {
    userOps[f]([], utils.testError(t, 'Error: query error test'))
  })
})

test('createUser should return an error if reading the user fails', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT id, name from users', undefined, {rowCount: 1, rows: [{id: 1234}]})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.createUser([], utils.testError(t, 'Error: query error test'))
})

test('createUserById should return an error if reading the user fails', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT id, name from users', undefined, {rowCount: 1, rows: [{id: 1234}]})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.createUserById([], utils.testError(t, 'Error: query error test'))
})

test('readUserById should return an error if the team cannot be retrieved', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT teams.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.readUserById([], utils.testError(t, 'Error: query error test'))
})

test('readUserById should return an error if the policies cannot be retrieved', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT pol.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.readUserById([], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if teams is not an array', (t) => {
  t.plan(3)
  var dbPool = {}
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test'], utils.testError(t, 'Bad Request'))
})

test('updateUser should return an error if policies is not an array', (t) => {
  t.plan(3)
  var dbPool = {}
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', []], utils.testError(t, 'Bad Request'))
})

test('updateUser should return an error if the transaction cannot be started', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if the update query fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE users', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if the delete query on team_members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if the insert query on team_members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [1], []], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if the delete query on user_policies fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if the insert query on team_members fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO user_policies', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], [1]], utils.testError(t, 'Error: query error test'))
})

test('updateUser should return an error if commit fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.updateUser([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('deleteUserById should return an error if the transaction cannot be started', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1], utils.testError(t, 'Error: query error test'))
})

test('deleteUserById should return an error if deleting from user policies fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from user_policies', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('deleteUserById should return an error if deleting from team memebers fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from team_members', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('deleteUserById should return an error if deleting from users fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from users', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1, 'test', [], []], utils.testError(t, 'Error: query error test'))
})

test('deleteUserById should return an error if deleting from users returns a rowCount 0', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, t: t}, {rowCount: 0})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1, 'test', [], []], utils.testError(t, 'Not Found'))
})

test('deleteUserById should return an error if commit fails', (t) => {
  t.plan(4)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, t: t})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1], utils.testError(t, 'Error: query error test'))
})

test('getUserByToken should return an error if selecting from users returns a rowCount 0', (t) => {
  t.plan(3)
  var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, undefined, {rowCount: 0})
  var userOps = UserOps(dbPool, mu, {debug: () => {}})

  userOps.deleteUserById([1, 'test', [], []], utils.testError(t, 'Not Found'))
})
