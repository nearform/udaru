'use strict'

const postgrator = require('postgrator')
const path = require('path')
const minimist = require('minimist')
const config = require('./../src/lib/config')

postgrator.setConfig({
  migrationDirectory: path.join(__dirname, '/migrations'),
  schemaTable: 'schemaversion', // optional. default is 'schemaversion'
  driver: 'pg', // or mysql, mssql
  host: config.get('pgdb.host', '127.0.0.1'),
  port: config.get('pgdb.port', 5432), // optionally provide port
  database: config.get('pgdb.database', 'authorization'),
  username: config.get('pgdb.user', 'postgres'),
  password: config.get('pgdb.password', 'postgres')
})

const argv = minimist(process.argv.slice(2))

if (!argv.version) {
  console.log('Please provide the version to migrate to')
  process.exit(1)
}

postgrator.migrate(argv.version, function (err, migrations) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  postgrator.endConnection(function (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }

    console.log(`Migrations to ${argv.version} done`, migrations)
  })
})
