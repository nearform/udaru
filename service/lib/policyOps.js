'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const config = require('./config')

function insertPolicies (client, policies, cb) {
  const stmt = dbUtil.buildInsertStmt('INSERT INTO policies (version, name, org_id, statements) VALUES ', policies.map(policy => [policy.version, policy.name, policy.org_id, policy.statements]))
  client.query(stmt.statement + ' RETURNING id', stmt.params, cb)
}

module.exports = function (dbPool) {

  var policyOps = {

    /*
    * $1 = user_id
    */
    listAllUserPolicies: function listAllUserPolicies ({ userId }, cb) {
      const params = [
        userId
      ]
      /* Query1: For fetching policies attached directly to the user */
      /* Query2: For fetching policies attached to the teams the user belongs to */
      /* TO-DO Query3: For fetching policies attached to the organization the user belongs to */
      const sql = `(

          SELECT
            version,
            name,
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
            name,
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
      dbPool.query(sql, params, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        const userPolicies = result.rows.map(row => ({
          Version: row.version,
          Name: row.name,
          Statement: row.statements.Statement
        }))

        return cb(null, userPolicies)
      })
    },

    /**
     * List all policies (id, version and vame)
     *
     * @param  {Object}   args
     * @param  {Function} cb
     */
    listAllPolicies: function listAllPolicies (args, cb) {
      dbPool.query('SELECT  id, version, name from policies ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * List all the policies related to a specific organization
     *
     * @param  {String}   organizationId
     * @param  {Function} cb
     */
    listByOrganization: function listByOrganization (organizationId, cb) {
      dbPool.query('SELECT  id, version, name from policies WHERE org_id = $1 ORDER BY UPPER(name)', [organizationId], function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * gathers all policy list including the policy statements
     * no query args (but may e.g. sort in future)
     */
    listAllPoliciesDetails: function listAllPoliciesDetails (args, cb) {
      dbPool.query('SELECT  id, version, name, statements from policies ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * $1 = id
     */
    readPolicyById: function readPolicyById (args, cb) {
      dbPool.query('SELECT id, version, name, statements from policies WHERE id = $1', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /**
     * $1 = version
     * $2 = name
     * $3 = org_id
     * $4 = statements
     */
    createPolicy: function createPolicy (args, cb) {
      insertPolicies(dbPool, [{
        version: args[0],
        name: args[1],
        org_id: args[2],
        statements: args[3],
      }], (err, result) => {
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
          client.query('UPDATE policies SET version = $2, name = $3, org_id = $4, statements = $5 WHERE id = $1', [id, version, name, orgId, statements], (err, res) => {
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
        tasks.push((next) => { client.query('DELETE from user_policies WHERE policy_id = $1', [id], next) })
        tasks.push((next) => { client.query('DELETE from team_policies WHERE policy_id = $1', [id], next) })
        tasks.push((next) => {
          client.query('DELETE from policies WHERE id = $1', [id], (err, res) => {
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
    },

    createOrgDefaultPolicies: function createOrgDefaultPolicies (client, organizationId, cb) {
      const defaultPolicies = config.get('authorization.organizations.defaultPolicies', {'organizationId': organizationId})
      insertPolicies(client, defaultPolicies, cb)
    },

    createTeamDefaultPolicies: function createTeamDefaultPolicies (client, organizationId, teamId, cb) {
      const defaultPolicies = config.get('authorization.teams.defaultPolicies', {organizationId, teamId})
      insertPolicies(client, defaultPolicies, cb)
    }
  }

  return policyOps
}
