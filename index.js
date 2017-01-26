'use strict'

const wiring = require('./src/hapi-udaru/wiring-hapi')

wiring.start(() => {
  console.log('service listening...')
})
