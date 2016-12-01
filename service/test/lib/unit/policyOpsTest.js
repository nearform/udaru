'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const PolicyOps = require('../../../lib/policyOps')
const utils = require('../../utils')

lab.experiment('policyOps', () => {
  lab.test('should return an error if the db connection fails', (done) => {
    var dbPool = {connect: function (cb) {
      cb(new Error('connection error test'))
    }}
    var policyOps = PolicyOps(dbPool)
    var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        policyOps[f]({userId: 1234}, utils.testError(expect, 'connection error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('should return an error if the db query fails', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb = cb || params
        cb(new Error('query error test'))
      }}
      cb(undefined, client, () => {})
    }}
    var policyOps = PolicyOps(dbPool)
    var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById']
    var tasks = []

    functionsUnderTest.forEach((f) => {
      tasks.push((cb) => {
        policyOps[f]({userId: 1234}, utils.testError(expect, 'query error test', cb))
      })
    })

    async.series(tasks, done)
  })

  lab.test('readPolicyById should return an error if the query has row count 0', (done) => {
    var dbPool = {connect: function (cb) {
      var client = {query: (sql, params, cb) => {
        cb(undefined, {rowCount: 0})
      }}
      cb(undefined, client, () => {})
    }}
    var policyOps = PolicyOps(dbPool)

    policyOps.readPolicyById([1], utils.testError(expect, 'Not Found', done))
  })
})
