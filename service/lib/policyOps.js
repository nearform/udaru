'use strict'

/*
* $1 = user_id
*/
function listAllUserPolicies (pool, { userId }, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)

    /* Query1: For fetching policies attached directly to the user */
    /* Query2: For fetching policies attached to the teams user belongs to */
    const sql = `(

        SELECT
          version,
          statements
        FROM
          policies p JOIN user_policies up
        ON
          p.id = up.policy_id
        WHERE
          up.user_id = $1

      ) UNION (

        SELECT
          version,
          statements
        FROM
          policies p JOIN team_policies tp
        ON
          p.id = tp.policy_id
        WHERE
          tp.team_id IN (
            SELECT team_id FROM team_members tm WHERE tm.user_id = $1
          )
      )
    `

    const params = [
      userId
    ]

    client.query(sql, params, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)

      const userPolicies = result.rows.map(row => ({
        Version: row.version,
        Statement: row.statements.Statement
      }))

      return cb(null, userPolicies)
    })
  })
}

/*
* no query args (but may e.g. sort in future)
*/
function listAllPolicies (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, version, name from policies ORDER BY UPPER(name)', function (err, result) {
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
function listAllPoliciesDetails (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, version, name, statements from policies ORDER BY UPPER(name)', function (err, result) {
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
function readPolicyById (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT id, version, name, statements from policies WHERE id = $1', args, function (err, result) {
      done() // release the client back to the pool

      if (err) return cb(err)
      if (result.rowCount === 0) return cb('not found')

      var policy = result.rows[0]
      return cb(null, {id: policy.id, version: policy.version, name: policy.name, statements: policy.statements.Statement})
    })
  })
}

module.exports = {
  listAllPolicies: listAllPolicies,
  listAllPoliciesDetails: listAllPoliciesDetails,
  listAllUserPolicies: listAllUserPolicies,
  readPolicyById: readPolicyById
}
