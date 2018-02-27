'use strict'

const path = require('path')
const pg = require('pg')
const fs = require('fs')
const config = require('../lib/config/build-all')()

const client = new pg.Client(config.get('pgdb'))

let sql = ''
let sqlPath = ''
if (process.argv[2] === '-add') {
  sqlPath = path.join(__dirname, '/dbscripts/addTeamAndPolicyNameConstraints.sql')
} else if (process.argv[2] === '-remove') {
  sqlPath = path.join(__dirname, '/dbscripts/removeTeamAndPolicyNameConstraints.sql')
}

if (sqlPath === '') {
  console.log('Nothing to do... options -add or -remove')
} else {
  client.connect(() => {
    sql = fs.readFileSync(sqlPath, 'utf8')
    client.query(sql, (err) => {
      if (err) {
        console.error(err)
        process.exit()
      }
      console.log('Script ran successfully: ' + sqlPath)
      process.exit()
    })
  })
}
