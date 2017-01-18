'use strict'

const loader = require('./../src/lib/policiesLoader')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))
const organizationId = argv.org
const source = argv.src || argv._[0]

loader.load(organizationId, source, (err) => {
  if (err) {
    return loader.exit(err)
  }

  console.log('Done!')
})
