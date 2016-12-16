'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const UserOps = require('../../../lib/userOps')
const utils = require('../../utils')

let updateUserData

lab.experiment('userOps', () => {
  lab.beforeEach((done) => {
    updateUserData = {
      id: 1,
      organizationId: 'WONKA',
      name: 'test',
      teams: [],
      policies: []
    }

    done()
  })

  lab.test('should return an error if the db connection fails', (done) => {
    const userOps = UserOps(utils.getDbPollConnectionError(), {debug: () => {}})
    const functionsUnderTest = ['getUserOrganizationId', 'listOrgUsers', 'createUser', 'createUserById', 'readUser', 'updateUser', 'deleteUser']
    const tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        if (f === 'updateUser') {
          userOps.updateUser(updateUserData, utils.testError(expect, 'Error: connection error test', cb))
        } else {
          userOps[f]({}, utils.testError(expect, 'Error: connection error test', cb))
        }
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the first db query fails', (done) => {
    const userOps = UserOps(utils.getDbPollFirstQueryError(), {debug: () => {}})
    const functionsUnderTest = ['getUserOrganizationId', 'listOrgUsers', 'createUser', 'createUserById', 'readUser']
    const tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        userOps[f]([], utils.testError(expect, 'Error: query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('readUser should return an error if the team cannot be retrieved', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT teams.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.readUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readUser should return an error if the policies cannot be retrieved', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('SELECT pol.id', undefined, {rowCount: 1, rows: [{id: 1234, name: 'test'}]})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.readUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the transaction cannot be started', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser(updateUserData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the update query fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE users', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser(updateUserData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the delete query on team_members fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser(updateUserData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if the insert query on team_members fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO team_members', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    updateUserData.teams = [{ id: 1 }]
    userOps.updateUser(updateUserData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('replaceUserPolicies should return an error if the delete query on user_policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.replaceUserPolicies({ id: 1, policies: [], organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('replaceUserPolicies should return an error if the insert query on user_policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.replaceUserPolicies({ id: 1, policies: [{ id: 1 }], organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('addUserPolicies should return an error if the insert query on user_policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.addUserPolicies({ id: 1, policies: [{ id: 1 }], organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserPolicies should return an error if the delete query on user_policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserPolicies({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUserPolicy should return an error if the delete query on user_policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUserPolicy({ userId: 1, policyId: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updateUser should return an error if commit fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.updateUser(updateUserData, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUser should return an error if the transaction cannot be started', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('BEGIN', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUser should return an error if deleting from user policies fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM user_policies', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUser should return an error if deleting from team memebers fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM team_members', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUser should return an error if deleting from users fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE FROM users', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deleteUser should return an error if deleting from users returns a rowCount 0', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: Not Found', done))
  })

  lab.test('deleteUser should return an error if commit fails', (done) => {
    const dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    const userOps = UserOps(dbPool, {debug: () => {}})

    userOps.deleteUser({ id: 1, organizationId: 'WONKA' }, utils.testError(expect, 'Error: query error test', done))
  })
})
