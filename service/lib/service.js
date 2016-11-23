'use strict'

const log = require('pino')()

const dbConn = require('./dbConn')
const UserOps = require('./userOps')
const PolicyOps = require('./policyOps')
const TeamOps = require('./teamOps')
const Authorize = require('./authorizeOps')

module.exports = function (opts, done) {
  log.level = opts && opts.logLevel || 'info'
  const db = dbConn.create(log)
  const userOps = UserOps(db.pool, opts.mu, log)
  const policyOps = PolicyOps(db.pool, opts.mu)
  const teamOps = TeamOps(db.pool, opts.mu, log)
  const authorize = Authorize(userOps, policyOps, opts.mu)

  function listAllUsers (args, cb) {
    userOps.listAllUsers(args, cb)
  }

  function listOrgUsers (args, cb) {
    userOps.listOrgUsers(args, cb)
  }

  function createUser (args, cb) {
    userOps.createUser(args, cb)
  }

  function createUserById (args, cb) {
    userOps.createUserById(args, cb)
  }

  function readUserById (args, cb) {
    userOps.readUserById(args, cb)
  }

  function updateUser (args, cb) {
    userOps.updateUser(args, cb)
  }

  function deleteUserById (args, cb) {
    userOps.deleteUserById(args, cb)
  }

  function getUserByToken (args, cb) {
    userOps.getUserByToken(args, cb)
  }

  function shutdown (args, cb) {
    db.shutdown(args, cb)
  }

  function listAllPolicies (args, cb) {
    policyOps.listAllPolicies(args, cb)
  }

  function listAllPoliciesDetails (args, cb) {
    policyOps.listAllPoliciesDetails(args, cb)
  }

  function readPolicyById (args, cb) {
    policyOps.readPolicyById(args, cb)
  }

  function listAllTeams (args, cb) {
    teamOps.listAllTeams(args, cb)
  }

  function listOrgTeams (args, cb) {
    teamOps.listOrgTeams(args, cb)
  }

  function createTeam (args, cb) {
    teamOps.createTeam(args, cb)
  }

  function readTeamById (args, cb) {
    teamOps.readTeamById(args, cb)
  }

  function updateTeam (args, cb) {
    teamOps.updateTeam(args, cb)
  }

  function deleteTeamById (args, cb) {
    teamOps.deleteTeamById(args, cb)
  }

  function isUserAuthorized (args, cb) {
    authorize.isUserAuthorized(args, cb)
  }

  function listAuthorizations (args, cb) {
    authorize.listAuthorizations(args, cb)
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
      isUserAuthorized: isUserAuthorized,
      listAuthorizations: listAuthorizations,
      getUserByToken: getUserByToken,
      destroy: shutdown
    })
  }, 500)
}
