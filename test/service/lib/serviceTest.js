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

// TODO: add checks for rowcounts, in e.g. createUser

test('list of all users', (t) => {
  t.plan(3)
  service((svc) => {
    svc.listAllUsers({}, (err, result) => {
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
    svc.listOrgUsers([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
// TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('create a user', (t) => {
  t.plan(2)
  service((svc) => {
    svc.createUser([99, 'Mike Teavee', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      console.log('RESULT: ', result)
/*      svc.readUserById([99], (err, result) => {
        t.error(err, 'should be no error reading back after creation')
        t.ok(result, 'result should be supplied')
        t.deepEqual(result, [{ id: 99, name: 'Mike Teavee' }], 'data should be as expected')
        svc.destroy({}, (err, result) => {
          t.error(err)
        })
      })*/
    })
  })
})

test('update a user', (t) => {
  t.plan(3)
  service((svc) => {
    svc.updateUser([99, 'Augustus Gloop'], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific user', (t) => {
  t.plan(3)
  service((svc) => {
    svc.readUserById([1], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // t.deepEqual(result, [{ id: 99, name: 'Augustus Gloop' }], 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('delete a user', (t) => {
  t.plan(3)
  service((svc) => {
    svc.deleteUserById([99], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // t.deepEqual(result, { id: 3, name: 'Veruca Salt' }, 'data should be as expected')
      // TODO: test correct data exists before and after the call
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})
