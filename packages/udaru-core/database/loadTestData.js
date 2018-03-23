#!/usr/bin/env node

'use strict'

const path = require('path')
const pg = require('pg')
const fs = require('fs')
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))

const pgConf = {
  user: argv.user || 'postgres',
  database: argv.database || 'authorization',
  password: argv.password || 'postgres',
  host: argv.host || 'localhost',
  port: argv.port || 5432
}

const client = new pg.Client(pgConf)

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
