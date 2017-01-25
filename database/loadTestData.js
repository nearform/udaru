'use strict'

const path = require('path')
const pg = require('pg')
const fs = require('fs')
const config = require('./../src/lib/config')

if (!config.get('local')) {
  console.log('ERROR: You are trying to load test data in the database while not in local environment.')
  process.exit(1)
}

const client = new pg.Client(config.get('pgdb'))

let fixturesSQL = fs.readFileSync(path.join(__dirname, '/testdata/fixtures.sql'), 'utf8')

const mapping = {
  organizations: {
    fields: 'id, name, description',
    filename: 'testdata/organizations.csv'
  },
  users: {
    fields: 'id, name, org_id',
    filename: 'testdata/users.csv'
  },
  teams: {
    fields: 'id, name, description, team_parent_id, org_id, path',
    filename: 'testdata/teams.csv'
  },
  team_members: {
    fields: 'user_id, team_id',
    filename: 'testdata/team_members.csv'
  },
  user_policies: {
    fields: 'user_id, policy_id',
    filename: 'testdata/user_policies.csv'
  },
  team_policies: {
    fields: 'team_id, policy_id',
    filename: 'testdata/team_policies.csv'
  }
}

function connect (next) {
  client.connect(next)
}

function copy (key, next) {
  var stream = client.query(copyFrom(`COPY ${key}(${mapping[key].fields}) FROM STDIN (FORMAT csv)`))
  var fileStream = fs.createReadStream(path.join(__dirname, mapping[key].filename))

  fileStream.on('error', next)
  stream.on('error', next)
  stream.on('end', next)

  fileStream.pipe(stream)
}

function copyOrganizations (next) {
  copy('organizations', next)
}

function copyUsers (next) {
  copy('users', next)
}

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
