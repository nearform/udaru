'use strict'

const wiring = require('./wiring-hapi')

wiring.start(() => {
  console.log('service listening...')
})
