'use strict'

const test = require('tap').test
const service = require('../../../service/lib/service')

test('authorize check on a resource and action', (t) => {
  t.plan(4)

  service((svc) => {
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
