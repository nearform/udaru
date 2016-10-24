'use strict'
const dbConn = require('./dbConn')
const userOps = require('./userOps')
const policyOps = require('./policyOps')

module.exports = function (done) {
  var db = dbConn.create()

// TODO consider using bind functions instead of this repetitive boilerplate

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
      destroy: shutdown
    })
  }, 500)
}
