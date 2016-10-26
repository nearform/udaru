'use strict'
const dbConn = require('./dbConn')
const userOps = require('./userOps')
const teamOps = require('./teamOps')
const policyOps = require('./policyOps')

module.exports = function (done) {
  var db = dbConn.create()

  function listAllUsers (args, cb) {
    userOps.listAllUsers(db.pool, args, cb)
  }

  function listOrgUsers (args, cb) {
    userOps.listOrgUsers(db.pool, args, cb)
  }

  function createUser (args, cb) {
    userOps.createUser(db.pool, args, cb)
  }

  function createUserById (args, cb) {
    userOps.createUserById(db.pool, args, cb)
  }

  function readUserById (args, cb) {
    userOps.readUserById(db.pool, args, cb)
  }

  function updateUser (args, cb) {
    userOps.updateUser(db.pool, args, cb)
  }

  function deleteUserById (args, cb) {
    userOps.deleteUserById(db.pool, args, cb)
  }

  function shutdown (args, cb) {
    db.shutdown(args, cb)
  }

  function listAllPolicies (args, cb) {
    policyOps.listAllPolicies(db.pool, args, cb)
  }

  function listAllPoliciesDetails (args, cb) {
    policyOps.listAllPoliciesDetails(db.pool, args, cb)
  }

  function readPolicyById (args, cb) {
    policyOps.readPolicyById(db.pool, args, cb)
  }

  function listAllTeams (args, cb) {
    teamOps.listAllTeams(db.pool, args, cb)
  }

  function listOrgTeams (args, cb) {
    teamOps.listOrgTeams(db.pool, args, cb)
  }

  function createTeam (args, cb) {
    teamOps.createTeam(db.pool, args, cb)
  }

  function readTeamById (args, cb) {
    teamOps.readTeamById(db.pool, args, cb)
  }

  function updateTeam (args, cb) {
    teamOps.updateTeam(db.pool, args, cb)
  }

  function deleteTeamById (args, cb) {
    teamOps.deleteTeamById(db.pool, args, cb)
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
