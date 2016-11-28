'use strict'

var config = require('./lib/config')

const wiring = require('../service/wiring-mu')(config.get('mu'))

wiring.start(() => {
  console.log(`service listening on port: ${config.get('mu').port}`)
})
