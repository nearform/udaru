'use strict'

var test = require('tap').test
var service = require('../../../service/lib/service')

test('service starts and stops', (t) => {
  t.plan(1)
  service((svc) => {
    svc.destroy({}, (err, result) => {
      t.error(err)
    })
  })
})

test('list of users', (t) => {
  t.plan(3)
  service((svc) => {
    svc.listUsers({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
// TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific user', (t) => {
  t.plan(4)
  service((svc) => {
    svc.readUserById([2], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result, [{ id: 2, name: 'Grandpa Joe' }], 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('delete a user', (t) => {
  t.plan(3)
  service((svc) => {
    svc.deleteUserById([3], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      console.log('result:', result)
      // t.deepEqual(result, { id: 3, name: 'Veruca Salt' }, 'data should be as expected')
      // TODO: test correct data exists before and after the call
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})
