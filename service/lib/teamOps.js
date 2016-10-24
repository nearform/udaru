'use strict'

/*
* no query args (but may e.g. sort in future)
*/
function listAllTeams (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, name, description from teams', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* $1 = org_id
*/
function listOrgTeams (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, name, description from teams WHERE org_id = $1', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

module.exports = {
  listAllTeams: listAllTeams,
  listOrgTeams: listOrgTeams
}
