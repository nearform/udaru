'use strict'

// TODO: the test structure / mu wiring approach needs rework
// as currently frequently times out (address in use)

var test = require('tap').test
var mu = require('mu')()
var tcp = require('mu/drivers/tcp')

var opts = { port: process.env.SERVICE_PORT || 8080, host: process.env.SERVICE_HOST || 'localhost', logLevel: process.env.LOG_LEVEL || 'info' }
var wiring = require('../wiring-mu')(opts)

test('wiring test', (t) => {
  t.plan(1)

  mu.outbound('*', tcp.client(opts))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
      t.error(err)

      wiring.stop()
      mu.tearDown()
    })
  })
})
