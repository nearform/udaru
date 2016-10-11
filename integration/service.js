'use strict'

const SERVICE_PORT = process.env.SERVICE_PORT || 8080
const SERVICE_HOST = process.env.SERVICE_HOST || 'localhost'

var opts = {port: SERVICE_PORT, host: SERVICE_HOST}
const wiring = require('../service/wiring-mu')(opts)

wiring.start(() => {
  console.log(`service listening on port: ${opts.port}`)
})
