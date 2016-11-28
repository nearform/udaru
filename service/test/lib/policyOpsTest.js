'use strict'

const mu = require('mu')()
const test = require('tap').test
const service = require('../../lib/service')
const PolicyOps = require('../../lib/policyOps')
const utils = require('../utils')

var opts = {
  logLevel: 'warn',
  mu
}

test('list policies', (t) => {
  t.plan(4)

  service(opts, (svc) => {
    svc.listAllPolicies({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.ok(result.length !== 0, 'number of expected results')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('list all policies full', (t) => {
  t.plan(7)
  service(opts, (svc) => {
    svc.listAllPoliciesDetails({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')

      if (result.length) {
        const policy = result[0]

        t.ok(policy.id, 'id should be supplied')
        t.ok(policy.name, 'name should be supplied')
        t.ok(policy.version, 'version should be supplied')
        t.ok(policy.statements, 'statements should be supplied')
      }

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific policy', (t) => {
  t.plan(7)
  service(opts, (svc) => {
    svc.readPolicyById([1], (err, policy) => {
      t.error(err, 'should be no error')
      t.ok(policy, 'policy should be supplied')

      t.ok(policy.id, 'id should be supplied')
      t.ok(policy.name, 'name should be supplied')
      t.ok(policy.version, 'version should be supplied')
      t.ok(policy.statements, 'statements should be supplied')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('should return an error if the db connection fails', (t) => {
  t.plan(12)
  var dbPool = {connect: function (cb) {
    cb(new Error('connection error test'))
  }}
  var policyOps = PolicyOps(dbPool, mu)
  var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById']

  functionsUnderTest.forEach((f) => {
    policyOps[f]({userId: 1234}, utils.testError(t, 'connection error test'))
  })
})

test('should return an error if the db query fails', (t) => {
  t.plan(12)
  var dbPool = {connect: function (cb) {
    var client = {query: (sql, params, cb) => {
      cb = cb || params
      cb(new Error('query error test'))
    }}
    cb(undefined, client, () => {})
  }}
  var policyOps = PolicyOps(dbPool, mu)
  var functionsUnderTest = ['listAllUserPolicies', 'listAllPolicies', 'listAllPoliciesDetails', 'readPolicyById']

  functionsUnderTest.forEach((f) => {
    policyOps[f]({userId: 1234}, utils.testError(t, 'query error test'))
  })
})

test('readPolicyById should return an error if the query has row count 0', (t) => {
  t.plan(3)
  var dbPool = {connect: function (cb) {
    var client = {query: (sql, params, cb) => {
      cb(undefined, {rowCount: 0})
    }}
    cb(undefined, client, () => {})
  }}
  var policyOps = PolicyOps(dbPool, mu)

  policyOps.readPolicyById([1], utils.testError(t, 'Not Found'))
})
