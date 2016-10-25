'use strict'

/*
* no query args (but may e.g. sort in future)
*/
function listAllPolicies (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, version, name from policies ORDER BY name', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* gathers all policy list including the policy statements
* no query args (but may e.g. sort in future)
*/
function listAllPoliciesDetails (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, version, name, statements from policies ORDER BY name', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      var results = result.rows.map((policy) => {
        return {id: policy.id, version: policy.version, name: policy.name, statements: policy.statements.Statement}
      })
      return cb(null, results)
    })
  })
}

/*
* $1 = id
*/
function readPolicyById (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT id, version, name, statements from policies WHERE id = $1', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      if (result.rows.length === 0) return cb(null, {})

      var policy = result.rows[0]
      return cb(null, {id: policy.id, version: policy.version, name: policy.name, statements: policy.statements.Statement})
    })
  })
}

module.exports = {
  listAllPolicies: listAllPolicies,
  listAllPoliciesDetails: listAllPoliciesDetails,
  readPolicyById: readPolicyById
}
