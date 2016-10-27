'use strict'

const test = require('tap').test
const service = require('../../../service/lib/service')
/* eslint-disable handle-callback-err */
var opts = {
  logLevel: 'warn'
}

test('authorize check on a resource and action', (t) => {
  t.plan(4)

  service(opts, (svc) => {
    let testUserId

    svc.createUser(['Salman', 'WONKA'], (err, result) => {
      testUserId = result.id

      svc.updateUser([testUserId, 'Salman', [{id: 4}], [{id: 1}]], (err, result) => {

        svc.isUserAuthorized({
          userId: testUserId,
          resource: 'filestore:dev:project-data',
          action: 'files:List'
        }, (err, result) => {
          t.error(err, 'should be no error')
          t.ok(result, 'result should be supplied')
          t.deepEqual(result.access, true, 'data should be as expected')

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


test('authorize michele', (t) => {
  t.plan(4)

  service(opts, (svc) => {
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
