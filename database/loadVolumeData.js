'use strict'

/* /bench/util/volumeRunner.js needs to have same values as here for teams, users etc. */
const NUM_TEAMS = 500 // total number of teams

const USER_START_ID = 1 // user start id, we may want a few super users
const TEAM_START_ID = 7 // user start id, so as not to interfere with other test data
const SUB_TEAM_MOD = 100 // 1 parent for every X-1 teams
const NUM_USERS_PER_TEAM = 100 // put this many users in each team
const NUM_POLICIES_PER_TEAM = 10 // :-|
const ADD_METADATA = true

const path = require('path')
const pg = require('pg')
const fs = require('fs')
const chalk = require('chalk')
const config = require('../lib/config/build-all')()

if (!config.get('local')) {
  console.error('ERROR: You are trying to load test data in the database while not in local environment.')
  process.exit(1)
}

const client = new pg.Client(config.get('pgdb'))

var startTime
var endTime

function loadVolumeDataBegin (callback) {
  startTime = Date.now()
  console.log('loadVolume data started at ' + startTime)

  // load original test data also..., should not interfere
  console.log('loading existing fixtures from: ' + path.join(__dirname, '/testdata/fixtures.sql'))
  let fixturesSQL = fs.readFileSync(path.join(__dirname, '/testdata/fixtures.sql'), 'utf8')

  client.connect(() => { // connect first, then set off daisy chain of queries on success
    client.query(fixturesSQL, (err) => {
      if (err) {
        callback(err)
      } else {
        endTime = Date.now()
        console.log(chalk.green('successfully loaded original fixtures'))
        loadTeams('CONCH', callback) // loads load everything into WONKA org
      }
    })
  })
}

function loadTeams (orgId, callback) {
  // insert teams
  console.log('inserting teams')
  let fixturesSQL = 'INSERT INTO teams (id, name, description, team_parent_id, org_id, path)\nVALUES\n'
  for (var i = TEAM_START_ID; i < (NUM_TEAMS + TEAM_START_ID); i++) {
    // root level teams
    if (((i - TEAM_START_ID + 1) % SUB_TEAM_MOD) === 1) {
      fixturesSQL += '(' + i + ", 'TEAM_" + i +
        "', 'Root level team', NULL, '" + orgId + "', TEXT2LTREE('" + i + "'))"
      var currentParentId = i
    } else {
      fixturesSQL += '(' + i + ", 'TEAM_" + i +
        "', 'Subordinate of TEAM_" + currentParentId + "', " + currentParentId + ", '" + orgId + "', TEXT2LTREE('" + i + "'))"
    }

    if (i === (NUM_TEAMS + TEAM_START_ID - 1)) {
      fixturesSQL += ';'
    } else {
      fixturesSQL += ',\n'
    }
  }

  console.log(fixturesSQL)
  client.query(fixturesSQL, function (err, result) {
    if (err) {
      callback(err)
    } else {
      console.log(chalk.green('success inserting teams'))
      loadPolicies(1, orgId, TEAM_START_ID, callback)
    }
  })
}

function getPolicyTemplate () {
  var policyTemplate = {}
  var statement = []
  statement[0] = {}
  statement[0].Effect = 'Allow'
  statement[0].Action = ['Read']
  statement[0].Resource = ['x']
  statement[1] = {}
  statement[1].Effect = 'Deny'
  statement[1].Action = ['Write']
  statement[1].Resource = ['y']
  policyTemplate.Statement = statement
  return policyTemplate
}

function loadPolicies (startId, orgId, teamId, callback) {
  // insert policies, for each team we need 10 per team
  console.log('inserting policies for team ' + teamId)

  var policyTemplate = getPolicyTemplate()

  let policiesSql = 'INSERT INTO policies (id, version, name, org_id, statements)\nVALUES\n'
  let teamPoliciesSql = 'INSERT INTO team_policies(team_id, policy_id)\nVALUES\n'

  // 10 policies per team
  var count = 1
  for (var id = startId; id < startId + NUM_POLICIES_PER_TEAM; id++) {
    // modify policy here...
    policyTemplate.Statement[0].Resource[0] = 'db:team_' + teamId + ':x_' + count
    policyTemplate.Statement[1].Resource[0] = 'db:team_' + teamId + ':y_' + count

    policiesSql += "('" + id + "', 0.1, 'POLICY_" + id + "', '" + orgId + "', '" +
      JSON.stringify(policyTemplate) + "'::JSONB)"

    teamPoliciesSql += "('" + teamId + "','" + id + "')"

    if (id === (startId + NUM_POLICIES_PER_TEAM - 1)) {
      policiesSql += ';'
      teamPoliciesSql += ';'
    } else {
      policiesSql += ',\n'
      teamPoliciesSql += ',\n'
    }

    count++
  }

  var fixturesSQL = 'BEGIN;\n'
  fixturesSQL += policiesSql + '\n'
  fixturesSQL += teamPoliciesSql + '\n'
  fixturesSQL += 'COMMIT;\n'

  client.query(fixturesSQL, function (err, result) {
    if (err) {
      callback(err)
    } else {
      console.log(chalk.green('success inserting policies for team ' + teamId))

      if (teamId < NUM_TEAMS + TEAM_START_ID - 1) {
        // load policies for next team
        loadPolicies(id, orgId, teamId + 1, callback)
      } else {
        // move on to loading users
        loadUsers(USER_START_ID, orgId, TEAM_START_ID, callback)
      }
    }
  })
}

function getMetaData (val1, val2) {
  if (ADD_METADATA) {
    var obj = {
      key1: val1,
      key2: val2
    }
    return "'" + JSON.stringify(obj) + "'::JSONB"
  }

  return null
}

// insert users and add them to teams in batches
function loadUsers (startId, orgId, teamId, callback) {
  // insert users
  console.log('inserting users ' + startId + ' to ' + (startId + NUM_USERS_PER_TEAM - 1) + ' into team: ' + teamId)

  var userSql = 'INSERT INTO users (id, name, org_id, metadata)\nVALUES\n'
  var userTeamSql = 'INSERT INTO team_members (user_id, team_id)\nVALUES\n'
  for (var id = startId; id < (startId + NUM_USERS_PER_TEAM); id++) {
    userSql += "('" + id + "', 'USER_" + id + "', '" + orgId + "'," + getMetaData(id, orgId) + ')'
    userTeamSql += "('" + id + "', '" + teamId + "')"

    if (id === startId + NUM_USERS_PER_TEAM - 1) {
      userSql += ';'
      userTeamSql += ';'
    } else {
      userSql += ',\n'
      userTeamSql += ',\n'
    }
  }

  var fixturesSQL = 'BEGIN;\n'
  fixturesSQL += userSql + '\n'
  fixturesSQL += userTeamSql + '\n'
  fixturesSQL += 'COMMIT;\n'

  client.query(fixturesSQL, function (err, result) {
    if (err) {
      callback(err)
    } else {
      console.log(chalk.green('success inserting users ' + startId +
        ' to ' + (startId + NUM_USERS_PER_TEAM - 1)))
      if (teamId < NUM_TEAMS + TEAM_START_ID - 1) {
        loadUsers(id, orgId, teamId + 1, callback)
      } else {
        loadVolumeDataEnd(callback)
      }
    }
  })
}

function loadVolumeDataEnd (callback) {
  endTime = Date.now()
  console.log(chalk.green('loadVolumeData completed in ' + (endTime - startTime) + 'ms'))

  callback() // done
}

module.exports = loadVolumeDataBegin

if (require.main === module) {
  loadVolumeDataBegin((err) => {
    if (err) console.log(chalk.red(err, 'error'))
    try { client.end() } catch (e) { }
    process.exit(err ? 1 : 0)
  })
}
