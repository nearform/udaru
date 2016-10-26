'use strict'

const log = require('pino')()

const dbConn = require('./dbConn')
const userOps = require('./userOps')
const teamOps = require('./teamOps')
const policyOps = require('./policyOps')

module.exports = function (opts, done) {
  log.level = opts && opts.logLevel || 'info'
  const db = dbConn.create(log)
  const rsc = {
    pool: db.pool,
    log: log
  }

  function listAllUsers (args, cb) {
    userOps.listAllUsers(rsc, args, cb)
  }

  function listOrgUsers (args, cb) {
    userOps.listOrgUsers(rsc, args, cb)
  }

  function createUser (args, cb) {
    userOps.createUser(rsc, args, cb)
  }

  function createUserById (args, cb) {
    userOps.createUserById(rsc, args, cb)
  }

  function readUserById (args, cb) {
    userOps.readUserById(rsc, args, cb)
  }

  function updateUser (args, cb) {
    userOps.updateUser(rsc, args, cb)
  }

  function deleteUserById (args, cb) {
    userOps.deleteUserById(rsc, args, cb)
  }

  function shutdown (args, cb) {
    db.shutdown(args, cb)
  }

  function listAllPolicies (args, cb) {
    policyOps.listAllPolicies(rsc, args, cb)
  }

  function listAllPoliciesDetails (args, cb) {
    policyOps.listAllPoliciesDetails(rsc, args, cb)
  }

  function readPolicyById (args, cb) {
    policyOps.readPolicyById(rsc, args, cb)
  }

  function listAllTeams (args, cb) {
    teamOps.listAllTeams(rsc, args, cb)
  }

  function listOrgTeams (args, cb) {
    teamOps.listOrgTeams(rsc, args, cb)
  }

  function createTeam (args, cb) {
    teamOps.createTeam(rsc, args, cb)
  }

  function readTeamById (args, cb) {
    teamOps.readTeamById(rsc, args, cb)
  }

  function updateTeam (args, cb) {
    teamOps.updateTeam(rsc, args, cb)
  }

  function deleteTeamById (args, cb) {
    teamOps.deleteTeamById(rsc, args, cb)
  }

  // simulate resource initialization.
  // give ourselves plenty of time,
  // as less may give intermittent ECONNREFUSED
  setTimeout(function () {
    done({
      createUser: createUser,
      createUserById: createUserById,
      deleteUserById: deleteUserById,
      listAllUsers: listAllUsers,
      listAllPolicies: listAllPolicies,
      listAllPoliciesDetails: listAllPoliciesDetails,
      listOrgUsers: listOrgUsers,
      readUserById: readUserById,
      readPolicyById: readPolicyById,
      updateUser: updateUser,
      listAllTeams: listAllTeams,
      listOrgTeams: listOrgTeams,
      createTeam: createTeam,
      readTeamById: readTeamById,
      updateTeam: updateTeam,
      deleteTeamById: deleteTeamById,
      destroy: shutdown
    })
  }, 500)
}
