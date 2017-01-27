'use strict'

const wiring = require('./lib/wiring-hapi')

wiring.start(() => {
  console.log('service listening...')
})
