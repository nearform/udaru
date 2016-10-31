'use strict'

const mu = require('mu')()
const test = require('tap').test
const service = require('../../lib/service')

var opts = {
  logLevel: 'warn',
  mu
}

// TODO: add checks for rowcounts, in e.g. createUser

test('list of all users', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.listAllUsers({}, (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      // console.log(result)
// TODO:      t.deepEqual(result, expectedUserList, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('list of org users', (t) => {
  t.plan(3)
  service(opts, (svc) => {
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

test('create a user by ID', (t) => {
  t.plan(4)
  service(opts, (svc) => {
    svc.createUserById([99, 'Mike Teavee', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result, { id: 99, name: 'Mike Teavee', teams: [], policies: [] }, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('create a user', (t) => {
  t.plan(5)
  service(opts, (svc) => {
    svc.createUser(['Grandma Josephine', 'WONKA'], (err, result) => {
      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.name, 'Grandma Josephine', 'data should be as expected')
      // delete the user again, as we don't need it
      svc.deleteUserById([result.id], (err, result) => {
        t.error(err, 'should be no error')

        svc.destroy({}, (err, result) => {
          t.error(err)
        })
      })
    })
  })
})

test('update a user', (t) => {
  const data = [99, 'Augustus Gloop', [{'id': 4, 'name': 'Dream Team'}], [{'id': 1, 'name': 'DROP ALL TABLES!'}, { 'id': 2, 'name': 'THROW DESK' }]]
  t.plan(3)
  service(opts, (svc) => {
    svc.updateUser(data, (err, result) => {
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
  service(opts, (svc) => {
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

test('read a specific user that does not exist', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.readUserById([987654321], (err, result) => {
      t.equal(err.output.statusCode, 404)
      t.notOk(result, 'result should not be supplied')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('delete a user', (t) => {
  t.plan(2)
  service(opts, (svc) => {
    svc.deleteUserById([99], (err, result) => {
      t.error(err, 'should be no error')

      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})
