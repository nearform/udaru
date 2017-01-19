'use strict'

const path = require('path')
const async = require('async')
const pg = require('pg')
const fs = require('fs')
const copyFrom = require('pg-copy-streams').from
const config = require('./../src/lib/config')
const policiesLoader = require('./../src/lib/policiesLoader')

if (!config.get('local')) {
  console.log('ERROR: You are trying to load test data in the database while not in local environment.')
  process.exit(1)
}

const client = new pg.Client(config.get('pgdb'))

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

function copyTeams (next) {
  copy('teams', next)
}

function copyTeamMembers (next) {
  copy('team_members', next)
}

function loadPolicies (next) {
  policiesLoader.load('WONKA', path.join(__dirname, 'testdata/policies.json'), next)
}

function copyUserPolicies (next) {
  copy('user_policies', next)
}

function copyTeamPolicies (next) {
  copy('team_policies', next)
}

async.series([
  connect,
  copyOrganizations,
  copyUsers,
  copyTeams,
  copyTeamMembers,
  loadPolicies,
  copyUserPolicies,
  copyTeamPolicies
],
function (err) {
  if (err) console.log(err)

  client.end(function (err) {
    if (err) throw err

    console.log('Load test data: done')
  })
})
