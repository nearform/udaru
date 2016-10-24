
'use strict'

const test = require('tap').test
const service = require('../../../service/lib/service')

test('service starts and stops', (t) => {
  t.plan(1)
  service((svc) => {
    svc.destroy({}, (err, result) => {
      t.error(err)
    })
  })
})

test('list of all teams', (t) => {
  t.plan(3)
  service((svc) => {
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

test('list of org users', (t) => {
  t.plan(3)
  service((svc) => {
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
