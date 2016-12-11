'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL

module.exports = function (dbPool) {
  var policyOps = {

    /*
    * $1 = user_id
    */
    listAllUserPolicies: function listAllUserPolicies ({ userId }, cb) {
      /* Query1: For fetching policies attached directly to the user */
      /* Query2: For fetching policies attached to the teams the user belongs to */
      /* TO-DO Query3: For fetching policies attached to the organization the user belongs to */
      const sql = SQL `(

          SELECT
            version,
            name,
            statements
          FROM
            policies p JOIN user_policies up
          ON
            p.id = up.policy_id
          WHERE
            up.user_id = ${userId}

        ) UNION (

          SELECT
            version,
            name,
            statements
          FROM
            policies p JOIN team_policies tp
          ON
            p.id = tp.policy_id
          WHERE
            tp.team_id IN (
              SELECT team_id FROM team_members tm WHERE tm.user_id = ${userId}
            )
        )
      `
      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        const userPolicies = result.rows.map(row => ({
          Version: row.version,
          Name: row.name,
          Statement: row.statements.Statement
        }))

        return cb(null, userPolicies)
      })
    },

    /*
    * no query args (but may e.g. sort in future)
    */
    listAllPolicies: function listAllPolicies (args, cb) {
      dbPool.query('SELECT  id, version, name from policies ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * gathers all policy list including the policy statements
    * no query args (but may e.g. sort in future)
    */
    listAllPoliciesDetails: function listAllPoliciesDetails (args, cb) {
      dbPool.query('SELECT  id, version, name, statements from policies ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = id
    */
    readPolicyById: function readPolicyById (args, cb) {
      const [ id ] = args

      dbPool.query(SQL `SELECT id, version, name, statements from policies WHERE id = ${id}`, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /*
    * $1 = version
    * $2 = name
    * $3 = org_id
    * $4 = statements
    */
    createPolicy: function createPolicy (args, cb) {
      const [ version, name, orgId, statements ] = args
      const sql = SQL `
        INSERT INTO policies (id, version, name, org_id, statements)
        VALUES (DEFAULT, ${version}, ${name}, ${orgId}, ${statements})
        RETURNING id
      `

      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        policyOps.readPolicyById([result.rows[0].id], cb)
      })
    },

    /*
    * $1 = id
    * $2 = version
    * $3 = name
    * $4 = org_id
    * $5 = statements
    */
    updatePolicy: function updatePolicy (args, cb) {

      const [ id, version, name, orgId, statements ] = args
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        // Should we handle the updated version as a new version => update teams and users associated with the previous version?
        // Like in http://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-using.html#edit-managed-policy-console
        tasks.push((next) => {
          const sql = SQL `
            UPDATE policies
            SET version = ${version}, name = ${name}, org_id = ${orgId}, statements = ${statements}
            WHERE id = ${id}
          `

          client.query(sql, (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })
        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)

            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, {id, version, name, statements: JSON.parse(statements)})
        })
      })
    },

    /*
    * $1 = id
    */
    deletePolicyById: function deletePolicyById (args, cb) {
      const [ id ] = args
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => { client.query(SQL `DELETE from user_policies WHERE policy_id = ${id}`, next) })
        tasks.push((next) => { client.query(SQL `DELETE from team_policies WHERE policy_id = ${id}`, next) })
        tasks.push((next) => {
          client.query(SQL `DELETE from policies WHERE id = ${id}`, (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })

        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null)
        })
      })
    }
  }

  return policyOps
}
