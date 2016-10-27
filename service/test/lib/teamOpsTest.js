
'use strict'

const test = require('tap').test
const service = require('../../../service/lib/service')
let testTeamId

var opts = {
  logLevel: 'warn'
}

test('service starts and stops', (t) => {
  t.plan(1)
  service(opts, (svc) => {
    svc.destroy({}, (err, result) => {
      t.error(err)
    })
  })
})

test('list of all teams', (t) => {
  t.plan(3)
  service(opts, (svc) => {
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

test('list of org teams', (t) => {
  t.plan(3)
  service(opts, (svc) => {
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

test('create a team', (t) => {
  t.plan(4)
  service(opts, (svc) => {
    svc.createTeam(['Team 4', 'This is a test team', null, 'WONKA'], (err, result) => {
      testTeamId = result.id

      t.error(err, 'should be no error creating')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.name, 'Team 4', 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('read a specific team', (t) => {
  t.plan(4)
  service(opts, (svc) => {
    svc.readTeamById([testTeamId], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      t.deepEqual(result.id, testTeamId, 'data should be as expected')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('update a team', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.updateTeam([testTeamId, 'Team 5', 'description', [{'id': 1, 'name': 'Tom Watson'}, {'id': 2, 'name': 'Michael O\'Brien'}], [{'id': 1, 'name': 'Financial info access'}]], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})

test('delete a team', (t) => {
  t.plan(3)
  service(opts, (svc) => {
    svc.deleteTeamById([testTeamId], (err, result) => {
      t.error(err, 'should be no error')
      t.ok(result, 'result should be supplied')
      svc.destroy({}, (err, result) => {
        t.error(err)
      })
    })
  })
})
