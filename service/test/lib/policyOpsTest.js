'use strict'

const test = require('tap').test
const service = require('../../lib/service')

var opts = {
  logLevel: 'warn'
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
