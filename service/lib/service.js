var dbConn = require('./dbConn')
var pg = require('pg');
var userOps = require('./userOps')

module.exports = function (done) {

  var conn = dbConn.create()

  function listUsers (args, cb) {
    userOps.listUsers(conn.pool, function(err, result) {
      if (err) return cb(err)
      return cb(null, result)
    })
  }

  function shutdown (args, cb) {
    conn.shutdown(args, cb)
  }

  // simulate resource initialization
  setTimeout(function () {
    done({
      listUsers: listUsers,
      destroy: shutdown
    })
  }, 1000)
}
