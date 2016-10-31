'use strict'
/* eslint-disable handle-callback-err */

const async = require('async')
const test = require('tap').test
const service = require('../../lib/service')

test('authorize - check on a resource and action', (t) => {
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

test('authorize - get all user actions on a resource', (t) => {
  t.plan(13)

  service({}, (svc) => {
    let testUserId
    let testTeamId
    const testUserName = 'Orson Cart'
    const testTeamName = 'Actors'
    const testTeamParent = null
    const testTeamDesc = 'Famous Actors'
    const testOrgId = 'WONKA'
    const task = []

    // set-up
    task.push((cb) => {
      svc.createUser([testUserName, testOrgId], (err, result) => {
        testUserId = result.id
        console.log("testUserId: ", testUserId)
        cb(err, result)
      })
    })
    task.push((result, cb) => {
      svc.createTeam([testTeamName, testTeamDesc, testTeamParent, testOrgId], (err, result) => {
        testTeamId = result.id
        console.log("team id: ", testTeamId)
        cb(err, result)
      })
    })
    // test for no permissions on the resource
    task.push((result, cb) => {
      svc.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        t.error(err, 'should be no error')
        t.ok(result, 'result should be supplied')
        t.deepEqual(result.actions, [ ], 'should be no actions in result')
        cb(err, result)
      })
    })
    // test for team permissions on the resource
    task.push((result, cb) => {
      svc.updateTeam([testTeamId, testTeamName, testTeamDesc, [{id: testUserId}], [{id: 2}]], cb)
    })
    task.push((result, cb) => {
      svc.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        t.error(err, 'should be no error')
        t.ok(result, 'result should be supplied')
        t.deepEqual(result.actions, [ 'finance:ReadBalanceSheet' ], 'data should be as expected')
        cb(err, result)
      })
    })
    // test for user permissions on the resource
    task.push((result, cb) => {
      svc.updateUser([testUserId, testUserName, [], [{id: 3}]], cb)
    })
    task.push((result, cb) => {
      svc.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        t.error(err, 'should be no error')
        t.ok(result, 'result should be supplied')
        t.deepEqual(result.actions, [ 'finance:ReadBalanceSheet', 'finance:ImportBalanceSheet' ], 'data should be as expected')
        cb(err, result)
      })
    })
    // test for team and user permissions on the resource
    task.push((result, cb) => {
      svc.updateUser([testUserId, testUserName, [{id: 1}], [{id: 4}]], cb)
    })
    task.push((result, cb) => {
      svc.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        t.error(err, 'should be no error')
        t.ok(result, 'result should be supplied')
        t.deepEqual(result.actions, [ 'finance:ReadBalanceSheet', 'finance:EditBalanceSheet' ], 'data should be as expected')
        cb(err, result)
      })
    })
    // clean-up
    task.push((result, cb) => {
      svc.deleteUserById([testUserId], cb)
    })
    task.push((cb) => {
      svc.destroy({}, (err, result) => {
        t.error(err)
        cb(err, result)
      })
    })
    async.waterfall(task, (err) => {
      if (err) {
        t.end('test failed due to error: ', err)
      }
    })
  })
})


// test('authorize - get all user actions on a resource', (t) => {
//   t.plan(10)
//
//   service({}, (svc) => {
//     let testUserId
//     let testTeamId
//     const testUserName = 'Orson Cart'
//     const testTeamName = 'Actors'
//     const testOrgId = 'WONKA'
//     const task = []
//
//     // set-up
//     task.push((cb) => {
//       svc.createUser([testUserName, testOrgId], (err, result) => {
//         testUserId = result.id
//         cb(err, result)
//       })
//     })
//     task.push((cb) => {
//       svc.createTeam([testTeamName, testOrgId], (err, result) => {
//         testTeamId = result.id
//         cb(err, result)
//       })
//     })
//     // test for no permissions on the resource
//     task.push((result, cb) => {
//       svc.listAuthorizations({
//         userId: testUserId,
//         resource: 'database:pg01:balancesheet'
//       }, (err, result) => {
//         t.error(err, 'should be no error')
//         t.ok(result, 'result should be supplied')
//         t.deepEqual(result.actions, [ ], 'should be no actions in result')
//         cb(err, result)
//       })
//     })
//     // test for team permissions on the resource
//     task.push((result, cb) => {
//       svc.updateTeam([testTeamId, testTeamName, [{id: testUserId}], [{id: 2}]], cb)
//     })
//     task.push((result, cb) => {
//       svc.listAuthorizations({
//         userId: testUserId,
//         resource: 'database:pg01:balancesheet'
//       }, (err, result) => {
//         t.error(err, 'should be no error')
//         t.ok(result, 'result should be supplied')
//         t.deepEqual(result.actions, [ 'finance:ReadBalanceSheet' ], 'data should be as expected')
//         cb(err, result)
//       })
//     })
//     // test for team/user? permissions on the resource
//     task.push((result, cb) => {
//       svc.updateUser([testUserId, testUserName, [], [{id: 3}]], cb)
//     })
//     task.push((result, cb) => {
//       svc.listAuthorizations({
//         userId: testUserId,
//         resource: 'database:pg01:balancesheet'
//       }, (err, result) => {
//         t.error(err, 'should be no error')
//         t.ok(result, 'result should be supplied')
//         t.deepEqual(result.actions, [ 'finance:ReadBalanceSheet', 'finance:ImportBalanceSheet' ], 'data should be as expected')
//         cb(err, result)
//       })
//     })
//     // clean-up
//     task.push((result, cb) => {
//       svc.deleteUserById([testUserId], cb)
//     })
//     task.push((cb) => {
//       svc.destroy({}, (err, result) => {
//         t.error(err)
//         cb(err, result)
//       })
//     })
//     async.waterfall(task, (err) => {
//       if (err) {
//         t.end('test failed due to error: ', err)
//       }
//     })
//   })
// })
