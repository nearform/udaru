'use strict'

const _ = require('lodash')
const test = require('tap').test
const service = require('../../../service/lib/service')

test('list policies', (t) => {
  t.plan(5)
  service((svc) => {
    svc.listAllPolicies({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.ok(result.length === 5, 'number of expected results')
      var expectedResult = [{
        id: 1,
        version: '0.1',
        name: 'Administrator'
      }]
      var index = _.findIndex(result, (value) => { return _.isMatch(value, expectedResult[0]) })
      t.ok(index >= 0, 'expected data')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('list all policies full', (t) => {
  t.plan(5)
  service((svc) => {
    svc.listAllPoliciesDetails({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.ok(result.length === 5, 'number of expected results')
      let expectedResult = [{
        id: 1,
        version: '0.1',
        name: 'Administrator',
        statements: [{
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword']
        }]
      }]
      let index = _.findIndex(result, (value) => { return _.isMatch(value, expectedResult[0]) })
      t.ok(index >= 0, 'expected data')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific policy', (t) => {
  t.plan(4)
  service((svc) => {
    svc.readPolicyById([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')

      var expectedResult = {
        id: 1,
        version: '0.1',
        name: 'Administrator',
        statements: [{
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword']
        }]
      }
      t.ok(_.isMatch(result, expectedResult), 'expected data')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})
