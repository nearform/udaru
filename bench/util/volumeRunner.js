'use strict'
// run this AFTER /database/loadVolumeData.js has populated db successfully
const DEBUG = false // prints request/response details
const START_SERVER = true // true = fork udaru server

// ensure variables same as /database/loadVolumeData.js
const NUM_TEAMS = 500 // total number of teams
const TEAM_START_ID = 7 // user start id offset
const NUM_USERS_PER_TEAM = 100
const NUM_POLICIES_PER_TEAM = 10

// autocannon settings
const DURATION = 15 // how long to run tests for in seconds
const CONNECTIONS = 10 // number of concurrent connections

const autocannon = require('autocannon')
const path = require('path')
const chalk = require('chalk')

// part of initial route, this changes for second run
var partialRoute = '/authorization/access/'

var child = null
if (START_SERVER) {
  const spawn = require('child_process')
  // start udaru server
  console.log('Starting UDARU server...')
  // need stdin to determine when server starts
  child = spawn.fork(path.join(__dirname, '../../packages/udaru-server/start'), [], ['ignore', 'ignore', 'ignore', 'ipc'])

  child.on('message', (m) => {
    if (m.indexOf('Server started on:') !== -1) {
      console.log(chalk.green(m))
      startBench()
    } else {
      console.log(chalk.red(m))
      process.exit(0)
    }
  })

  child.on('close', (code, signal) => {
    console.log('Server received close event, shutting down')
    // as part of graceful exit after bench run, child.kill will cause this
    // might as well kill here if the server isn't running for any reason
    process.exit(0)
  })
} else {
  startBench()
}

var instance
function startBench () {
  console.log('Running autocannon against: ' + partialRoute + ', num teams: ' + NUM_TEAMS)
  instance = autocannon({
    title: 'Random requests to ' + partialRoute,
    url: 'http://localhost:8080',
    duration: DURATION,
    connections: CONNECTIONS,
    headers: {
      authorization: 'ROOTid',
      org: 'CONCH'
    },
    requests: [
      {
        method: 'GET',
        path: getPath()
      }
    ],
    setupClient: setupClient
  }, onComplete)

  autocannon.track(instance, {renderProgressBar: !DEBUG})

  instance.on('response', onResponse)
}

// allows for ctrl+c safely shut down
process.once('SIGINT', () => {
  // this will be called if we haven't kicked off a child process for UDARU
  console.log('\nStopping instance of autocannon...')
  instance.stop()

  if (child) {
    console.log('Kill server child process...')
    child.kill()
  }
})

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min // The maximum is inclusive and the minimum is inclusive
}

function getPath () {
  if (partialRoute === '/authorization/access/') {
    // get a random team
    var team = getRandomIntInclusive(TEAM_START_ID, TEAM_START_ID + NUM_TEAMS - 1)
    // get a random user within the team
    var user = ((team - TEAM_START_ID) * NUM_USERS_PER_TEAM) + getRandomIntInclusive(1, NUM_USERS_PER_TEAM)
    // get a random policy within the team
    var policy = getRandomIntInclusive(1, NUM_POLICIES_PER_TEAM)

    var dynamicPath = partialRoute + user + '/Read/db:team_' + team + ':x_' + policy

    debug('Next request: ' + dynamicPath)
    return dynamicPath
  } else if (partialRoute === '/authorization/users/') {
    // get a random user within the database, all we want to know is if a team is returned
    user = getRandomIntInclusive(1, NUM_TEAMS * NUM_USERS_PER_TEAM)
    dynamicPath = partialRoute + user + '/teams'

    debug('Next request: ' + dynamicPath)
    return dynamicPath
  } else {
    onComplete('invalid partial route')
    return null
  }
}

function debug (message) {
  if (DEBUG) {
    console.log(message)
  }
}

function onResponse (client, statusCode, returnBytes, responseTime) {
  // change path for next request
  var dynamicPath = getPath()

  var requests = [
    {
      method: 'GET',
      path: dynamicPath
    }
  ]

  client.setRequests(requests)

  debug(statusCode + ':' + returnBytes + 'b:' + responseTime + 'ms')
}

function setupClient (client) {
  client.on('body', onBodyReceived) // console.log a response body when its received
}

function onBodyReceived (buffer) {
  // here we are testing for valid response to ensure end-to-end has happened
  // not for any assertions etc., exit if failure occurs
  var s = buffer.toString('utf8')

  var testString = '"name":"TEAM_'
  if (partialRoute === '/authorization/access/') {
    testString = '{"access":true}'
  }

  if (s.indexOf(testString) === -1) {
    onComplete('Test failed: ' + s)
  } else {
    debug('Test Passed: contains ' + testString)
  }
}

function onComplete (err, res) {
  var shutDown = false
  if (err) {
    console.log(chalk.red(
      '\nExiting due to invalid response, ensure database loaded with correct number of teams etc. ' +
      '(see /database/loadVolumeData.js)'))
    console.error(err)
    shutDown = true
  } else {
    console.log('Results for: ' + partialRoute)
    console.log(res)
    if (partialRoute === '/authorization/access/') {
      // start second set of tests with users route to list teams
      partialRoute = '/authorization/users/'
      startBench()
    } else {
      shutDown = true
    }
  }

  if (shutDown) {
    if (child) {
      debug('Stopping UDARU server')
      child.kill()
      // process.exit will be called by close event handler for child process
    } else {
      process.exit(0)
    }
  }
}
