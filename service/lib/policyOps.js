'use strict'

var dbUtil = require('./dbUtil')

function listAllPolicies(pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, version, name from policies', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

module.exports = {
  listAllPolicies: listAllPolicies
}
