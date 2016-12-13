'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const PolicyOps = require('../../../lib/policyOps')
const utils = require('../../utils')

lab.experiment('policyOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var policyOps = PolicyOps(utils.getDbPollConnectionError())
    var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById', 'createPolicy', 'updatePolicy', 'deletePolicyById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        policyOps[f]([], utils.testError(expect, 'Error: connection error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the db query fails', (done) => {
    var policyOps = PolicyOps(utils.getDbPollFirstQueryError())
    var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById', 'updatePolicy', 'deletePolicyById', 'createPolicy']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        policyOps[f]([], utils.testError(expect, 'Error: query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('readPolicyById should return an error if the query has row count 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var policyOps = PolicyOps(dbPool)

    policyOps.readPolicyById(1, utils.testError(expect, 'Not Found', done))
  })

  lab.test('updatePolicy should return an error if the update fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('UPDATE policies', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.updatePolicy([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('updatePolicy should return an error if updating returns rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.updatePolicy([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Not Found', done))
  })

  lab.test('updatePolicy should return an error if the update commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.updatePolicy([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deletePolicyById should return an error if deliting from user_policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from user_policies', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.deletePolicyById([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deletePolicyById should return an error if deliting from team_policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from team_policies', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.deletePolicyById([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deletePolicyById should return an error if deliting from policies fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('DELETE from policies', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.deletePolicyById([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('deletePolicyById should return an error if deleting from policies returns rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.deletePolicyById([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Not Found', done))
  })

  lab.test('deletePolicyById should return an error if the delete commit fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('COMMIT', {testRollback: true, expect: expect})
    var policyOps = PolicyOps(dbPool, () => {})

    policyOps.deletePolicyById([1, '2016-07-03', 'name', 'org_id', ''], utils.testError(expect, 'Error: query error test', done))
  })
})
