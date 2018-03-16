'use strict'

const path = require('path')
const pg = require('pg')
const fs = require('fs')
const config = require('../packages/udaru-core/config')()

if (!config.get('local')) {
  console.error('ERROR: You are trying to load test data in the database while not in local environment.')
  process.exit(1)
}

const client = new pg.Client(config.get('pgdb'))

let fixturesSQL = fs.readFileSync(path.join(__dirname, '/testdata/fixtures.sql'), 'utf8')

function loadTestData (callback) {
  client.connect(() => {
    client.query(fixturesSQL, (err) => {
      callback(err)
    })
  })
}

module.exports = loadTestData

if (require.main === module) {
  loadTestData((err) => {
    if (err) console.error(err)
    process.exit(err ? 1 : 0)
  })
}
