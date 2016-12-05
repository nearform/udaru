'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const OrganizationOps = require('../../../lib/organizationOps')
const utils = require('../../utils')

lab.experiment('organizationOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var organizationOps = OrganizationOps(utils.getDbPollConnectionError(), {debug: () => {}})
    var functionsUnderTest = ['list', 'create', 'readById', 'update', 'deleteById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        organizationOps[f]({}, utils.testError(expect, 'Error: connection error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the first db query fails', (done) => {
    var organizationOps = OrganizationOps(utils.getDbPollFirstQueryError(), {debug: () => {}})
    var functionsUnderTest = ['list', 'create', 'readById', 'update', 'deleteById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        organizationOps[f]({}, utils.testError(expect, 'Error: query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('create should return an error if the insert fails', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount('INSERT INTO organizations')
    var organizationOps = OrganizationOps(dbPool, {debug: () => {}})

    organizationOps.create({}, utils.testError(expect, 'Error: query error test', done))
  })

  lab.test('readById should return an error if the row count is 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var organizationOps = OrganizationOps(dbPool, {debug: () => {}})

    organizationOps.readById({}, utils.testError(expect, 'Not Found', done))
  })

  lab.test('deleteById should return an error if deleting from users returns a rowCount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var organizationOps = OrganizationOps(dbPool, {debug: () => {}})

    organizationOps.deleteById({}, utils.testError(expect, 'Not Found', done))
  })

  lab.test('update should return an error if the update return rowcount 0', (done) => {
    var dbPool = utils.getDbPoolErrorForQueryOrRowCount(undefined, {testRollback: true, expect: expect}, {rowCount: 0})
    var organizationOps = OrganizationOps(dbPool, {debug: () => {}})

    organizationOps.update({}, utils.testError(expect, 'Not Found', done))
  })
})
