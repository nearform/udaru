'use strict'

var test = require('tap').test
var opts = {port: process.env.SERVICE_PORT || 6000, host: process.env.SERVICE_HOST || 'localhost'}
var Mu = require('mu')
var wiring = require('../../../service/wiring-mu')(opts)
var tcp = require('mu/drivers/tcp')


test('auth:listUsers list of users', (t) => {
  t.plan(2)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))

  wiring.start(() => {
    mu.dispatch({role: 'auth', cmd: 'list', type: 'users'}, (err, result) => {
      t.error(err)
      t.ok(result, 'result should be supplied')
      wiring.stop()
      mu.tearDown()
    })
  })
})

test('auth:done', (t) => {
  t.plan(1)
  var mu = Mu()
  mu.outbound('*', tcp.client(opts))

  wiring.start(() => {
    mu.dispatch({role: 'auth', cmd: 'done'}, (err, result) => {
      t.error(err)
      wiring.stop()
      mu.tearDown()
    })
  })
})
