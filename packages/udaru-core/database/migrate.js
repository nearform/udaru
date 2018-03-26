#!/usr/bin/env node

'use strict'

const postgrator = require('postgrator')
const path = require('path')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))
const version = argv.version
const host = argv.host || '127.0.0.1'
const port = argv.port || 5432
const database = argv.database || 'authorization'
const user = argv.user || 'postgres'
const password = argv.password || 'postgres'

if (!version) {
  console.error('Please provide the version to migrate to')
  process.exit(1)
}

postgrator.setConfig({
  migrationDirectory: path.join(__dirname, '/migrations'),
  schemaTable: 'schemaversion', // optional. default is 'schemaversion'
  driver: 'pg',
  host: host,
  port: port,
  database: database,
  username: user,
  password: password
})

postgrator.migrate(version, function (err, migrations) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  postgrator.endConnection(function (err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log(`Migrations to ${version} done`, migrations)
  })
})
