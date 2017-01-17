'use strict'

const wiring = require('./src/wiring-hapi')

wiring.start(() => {
  console.log('service listening...')
})
