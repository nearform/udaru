'use strict'

// TODO: the test structure / mu wiring approach needs rework
// as currently frequently times out (address in use)

var test = require('tap').test
var opts = {port: process.env.SERVICE_PORT || 6000, host: process.env.SERVICE_HOST || 'localhost'}
var Mu = require('mu')
var wiring = require('../../../service/wiring-mu')(opts)
var tcp = require('mu/drivers/tcp')

test('authorization:users:list (org)', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'list', type: 'users', params: [3]}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      // console.log(result)
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:user:create', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'create', type: 'user', params: ['Mike Teavee', 'WONKA']}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:user:read', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'read', type: 'user', params: [1]}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:user:read non-existent', (t) => {
  t.plan(2)  // 3 after bug fix
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'read', type: 'user', params: [98765432]}, (err, result) => {
      // console.log("error:", err)
      // console.log("result:", result)
// temporarily just use err, until mu bug fixed
      t.equal(err, 'not found')
      // t.equal(err.message, 'not found')
      // temporarily can't check this, until mu bug fixed
      // t.notOk(result, 'result should not be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:user:update', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'update', type: 'user', params: [99, 'Augustus Gloop']}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:user:delete', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'delete', type: 'user', params: [99]}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:policy:read', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'read', type: 'policy', params: [1]}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:policy:list', (t) => {
  t.plan(3)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'list', type: 'policies'}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
        t.error(err)
        wiring.stop()
        mu.tearDown()
      })
    })
  })
})

test('authorization:done', (t) => {
  t.plan(1)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))

  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
      t.error(err)
      wiring.stop()
      mu.tearDown()
    })
  })
})
