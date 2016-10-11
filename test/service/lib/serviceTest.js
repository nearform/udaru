'use strict'

var test = require('tap').test
var service = require('../../../service/lib/service')

test('list of users', (t) => {
  t.plan(3)
  service((svc) => {
    svc.listUsers({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
//TODO:      t.deepEqual(expectedUserList, result, 'data should be as expected')
      svc.shutdown({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('service response', (t) => {
  t.plan(1)
  service((svc) => {
    svc.shutdown({}, (err, result) => {
      t.error(err)
    })
  })
})
