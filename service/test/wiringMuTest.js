'use strict'

// TODO: the test structure / mu wiring approach needs rework
// as currently frequently times out (address in use)

var test = require('tap').test
var mu = require('mu')()
var tcp = require('mu/drivers/tcp')
var config = require('./../lib/config')

var wiring = require('../wiring-mu')(config.get('mu'))

test('wiring test', (t) => {
  t.plan(1)

  mu.outbound('*', tcp.client(config.get('mu')))
  wiring.start(() => {
    mu.dispatch({role: 'authorization', cmd: 'done'}, (err, result) => {
      t.error(err)

      wiring.stop()
      mu.tearDown()
    })
  })
})
