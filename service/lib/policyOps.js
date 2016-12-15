'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL
const config = require('./config')
const SQL = dbUtil.SQL

function formatInsertValues (policies) {
  if (Array.isArray(policies)) {
    return policies.map(policy => [policy.version, policy.name, policy.org_id, policy.statements])
  }

  return Object.keys(policies).map((pName) => {
    let policy = policies[pName]
    return [policy.version, policy.name, policy.org_id, policy.statements]
  })
}

function insertPolicies (client, policies, cb) {
  const stmt = dbUtil.buildInsertStmt('INSERT INTO policies (version, name, org_id, statements) VALUES ', formatInsertValues(policies))
  client.query(stmt.statement + ' RETURNING id', stmt.params, cb)
}

function deletePolicies (client, ids, cb) {
  client.query('DELETE FROM policies WHERE id = ANY($1)', [ids], cb)
}

function deleteTeamsAssociations (client, ids, cb) {
  client.query('DELETE from team_policies WHERE policy_id = ANY($1)', [ids], cb)
}

function deleteUsersAssociations (client, ids, cb) {
  client.query('DELETE from user_policies WHERE policy_id = ANY($1)', [ids], cb)
}

function getNames (policies) {
  return Object.keys(policies).map((key) => {
    return policies[key].name
  })
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
     * List all the policies related to a specific organization
     *
     * @param  {Object}   params { organizationId }
     * @param  {Function} cb
     */
    listByOrganization: function listByOrganization (params, cb) {
      const { organizationId } = params

      const sqlQuery = SQL`
        SELECT  *
        FROM policies
        WHERE org_id = ${organizationId}
        ORDER BY UPPER(name)
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * fetch specific policy
     *
     * @param  {Integer}  id
     * @param  {Function} cb
     */
    readPolicyById: function readPolicyById (id, cb) {
      const sqlQuery = SQL`
        SELECT  *
        FROM policies
        WHERE id = ${id}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /**
     * Creates a new policy
     *
     * @param  {Object}   params { version, name, organizationId, statements }
     * @param  {Function} cb
     */
    createPolicy: function createPolicy (params, cb) {
      const { version, name, organizationId, statements } = params

      insertPolicies(dbPool, [{
        version: version,
        name: name,
        org_id: organizationId,
        statements: statements
      }], (err, result) => {
        if (err) return cb(Boom.badImplementation(err))

        policyOps.readPolicyById(result.rows[0].id, cb)
      })
    },

    /**
     * Update policy values
     *
     * @param  {Object}   params { id, version, name, organizationId, statements }
     * @param  {Function} cb
     */
    updatePolicy: function updatePolicy (params, cb) {
      const { id, version, name, statements } = params
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query('UPDATE policies SET version = $2, name = $3, statements = $4 WHERE id = $1', [id, version, name, statements], (err, res) => {
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

    /**
     * Delete a specific policy
     *
     * @param  {Number}   id
     * @param  {Function} cb
     */
    deletePolicyById: function deletePolicyById (id, cb) {
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

    deleteAllPolicyByIds: function deleteAllPolicyByIds (client, ids, next) {
      async.applyEachSeries([
        deleteTeamsAssociations,
        deleteUsersAssociations,
        deletePolicies
      ], client, ids, next)
    },

    createOrgDefaultPolicies: function createOrgDefaultPolicies (client, organizationId, cb) {
      const defaultPolicies = config.get('authorization.organizations.defaultPolicies', {'organizationId': organizationId})
      insertPolicies(client, defaultPolicies, function (err, result) {
        if (err) return cb(err)

        const name = config.get('authorization.organizations.defaultPolicies.orgAdmin.name', {'organizationId': organizationId})
        client.query('SELECT id FROM policies WHERE org_id = $1 AND name = $2', [organizationId, name], function (err, result) {
          if (err) return cb(err)
          if (result.rowCount === 0) return cb(new Error(`No policy found for org ${organizationId} with name ${name}`))

          cb(null, result.rows[0].id)
        })
      })
    },

    createTeamDefaultPolicies: function createTeamDefaultPolicies (client, organizationId, teamId, cb) {
      const defaultPolicies = config.get('authorization.teams.defaultPolicies', {organizationId, teamId})
      insertPolicies(client, defaultPolicies, cb)
    },

    readTeamDefaultPolicies: function readTeamDefaultPolicies (client, organizationId, teamId, cb) {
      const defaultPolicies = config.get('authorization.teams.defaultPolicies', {organizationId, teamId})
      const names = getNames(defaultPolicies)
      client.query(SQL`SELECT id FROM policies WHERE name = ANY(${names})`, cb)
    }
  }

  return policyOps
}
