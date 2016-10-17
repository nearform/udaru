var dbConn = require('./dbConn')
var userOps = require('./userOps')

module.exports = function (done) {
  var db = dbConn.create()

  function listUsers (args, cb) {
    userOps.listUsers(db.pool, function (err, result) {
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

  function deleteUserById (args, cb) {
    userOps.deleteUserById(db.pool, args, function (err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function shutdown (args, cb) {
    db.shutdown(args, cb)
  }

  // simulate resource initialization
  setTimeout(function () {
    done({
      deleteUserById: deleteUserById,
      listUsers: listUsers,
      readUserById: readUserById,
      destroy: shutdown
    })
  }, 1000)
}
