'use strict'

// Note: you must run the server seperately.

const Autocannon = require('autocannon')
const Bloomrun = require('bloomrun')
const Minimist = require('minimist')

// Our test config
const Policies = require('../policies.bench.js')
const Ping = require('../ping.bench.js')
const Orgs = require('../orgs.bench.js')
const Teams = require('../teams.bench.js')
const Users = require('../users.bench.js')
const List = require('../list.bench.js')
const Access = require('../access.bench.js')

// Apply each test handler to bloomrun with a tag
function configureTests (tests) {
  const container = Bloomrun()

  tests.forEach((route) => {
    route.forEach((test) => {
      container.add({tag: test.tag}, test.handler)
    })
  })

  return container
}

// Prime the test suite, get the tag from cli, eg, `npm run bench -- get/orgs`
const tests = configureTests([Ping, Orgs, Policies, Teams, Users, List, Access])
const tag = (Minimist(process.argv.slice(2))._ || '').toString()

// If we don't have a matching tag we exit early
const getParams = tests.lookup({tag: tag})
if (typeof getParams !== 'function') {
  console.error(`No test found for tag: ${tag}`)
  process.exit()
}

// Generate params for the bench test
const params = getParams()
const opts = {
  connections: 500,
  duration: 10,
  title: tag,
  url: `http://localhost:8080${params.path}`,
  method: params.method,
  headers: params.headers,
  body: params.body
}

// Create the test and finish handler.
const instance = Autocannon(opts, (err, result) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }

  console.log('Detailed Result:', '\n\n', result)
})

// Starts the test and shows a pretty progress bar while it runs
Autocannon.track(instance)
