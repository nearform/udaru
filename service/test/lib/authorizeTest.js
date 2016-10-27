'use strict'
/* eslint-disable handle-callback-err */

const test = require('tap').test
const service = require('../../lib/service')

test('authorize check on a resource and action', (t) => {
  t.plan(7)

  service({}, (svc) => {
    let testUserId

    svc.createUser(['Salman', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error')

      testUserId = result.id

      svc.updateUser([testUserId, 'Salman', [{id: 4}], [{id: 1}]], (err, result) => {
        t.error(err, 'should be no error')

        svc.isUserAuthorized({
          userId: testUserId,
          resource: 'database:pg01:balancesheet',
          action: 'finance:ReadBalanceSheet'
        }, (err, result) => {
          t.error(err, 'should be no error')
          t.ok(result, 'result should be supplied')
          t.deepEqual(result.access, true, 'data should be as expected')

          svc.deleteUserById([testUserId], (err, result) => {
            t.error(err, 'should be no error')

            svc.destroy({}, (err, result) => {
              t.error(err, 'should be no error')
            })
          })
        })
      })
    })
  })
})


test('authorize get all user actions on a resource', (t) => {
  t.plan(4)

  service({}, (svc) => {
    let testUserId

    svc.createUser(['Salman', 'WONKA'], (err, result) => {
      testUserId = result.id

      svc.updateUser([testUserId, 'Salman', [{id: 4}], [{id: 1}]], (err, result) => {
        svc.listAuthorizations({
          userId: testUserId,
          resource: 'filestore:dev:project-data'
        }, (err, result) => {
          t.error(err, 'should be no error')
          t.ok(result, 'result should be supplied')
          t.deepEqual(result.actions, [ 'files:List', 'files:Edit' ], 'data should be as expected')

          svc.deleteUserById([testUserId], (err, result) => {
            svc.destroy({}, (err, result) => {
              t.error(err)
            })
          })
        })
      })
    })
  })
})
