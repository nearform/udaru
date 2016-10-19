var dbConn = require('./dbConn')
var userOps = require('./userOps')
var policyOps = require('./policyOps')

module.exports = function (done) {
  var db = dbConn.create()

// TODO consider using bind functions instead of this repetitive boilerplate

  function listAllUsers (args, cb) {
    userOps.listAllUsers(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function listOrgUsers (args, cb) {
    userOps.listOrgUsers(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function createUser (args, cb) {
    userOps.createUser(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function readUserById (args, cb) {
    userOps.readUserById(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function updateUser (args, cb) {
    userOps.updateUser(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function deleteUserById (args, cb) {
    userOps.deleteUserById(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function shutdown (args, cb) {
    db.shutdown(args, cb)
  }

  function listAllPolicies(args, cb) {
    policyOps.listAllPolicies(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  // simulate resource initialization.
  // give ourselves plenty of time,
  // as less may give intermittent ECONNREFUSED
  setTimeout(function () {
    done({
      createUser: createUser,
      deleteUserById: deleteUserById,
      listAllUsers: listAllUsers,
      listAllPolicies: listAllPolicies,
      listOrgUsers: listOrgUsers,
      readUserById: readUserById,
      updateUser: updateUser,
      destroy: shutdown
    })
  }, 5000)
}
