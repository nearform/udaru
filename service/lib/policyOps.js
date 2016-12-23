'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const config = require('./config')
const SQL = dbUtil.SQL
const mapping = dbUtil.mapping

function toArray (policies) {
  if (Array.isArray(policies)) {
    return policies
  }

  const result = []
  Object.keys(policies).map((pName) => {
    result.push(policies[pName])
  })

  return result
}

function insertPolicies (client, policies, cb) {
  policies = toArray(policies)

  const sql = SQL`INSERT INTO policies (version, name, org_id, statements) VALUES `
  sql.append(SQL`(${policies[0].version}, ${policies[0].name}, ${policies[0].org_id}, ${policies[0].statements})`)
  policies.slice(1).forEach((policy) => {
    sql.append(SQL`, (${policy.version}, ${policy.name}, ${policy.org_id}, ${policy.statements})`)
  })
  sql.append(SQL` RETURNING id`)

  client.query(sql, cb)
}

function deletePolicies (client, ids, cb) {
  client.query(SQL`DELETE FROM policies WHERE id = ANY (${ids})`, cb)
}

function deleteTeamsAssociations (client, ids, cb) {
  client.query(SQL`DELETE FROM team_policies WHERE policy_id = ANY (${ids})`, cb)
}

function deleteUsersAssociations (client, ids, cb) {
  client.query(SQL`DELETE FROM user_policies WHERE policy_id = ANY (${ids})`, cb)
}

function getNames (policies) {
  return Object.keys(policies).map((key) => {
    return policies[key].name
  })
}

function removePolicyFromUsers (job, next) {
  const { id } = job

  deleteUsersAssociations(job.client, [id], next)
}

function removePolicyFromTeams (job, next) {
  const { id } = job

  deleteTeamsAssociations(job.client, [id], next)
}

function removePolicy (job, next) {
  const { id, organizationId } = job

  const sqlQuery = SQL`
    DELETE FROM policies
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `
  job.client.query(sqlQuery, (err, res) => {
    if (err) return next(err)
    if (res.rowCount === 0) return next(Boom.notFound())

    next()
  })
}

module.exports = function (dbPool) {

  var policyOps = {

    /**
     * List all user policies
     *
     * @param  {Object}   params { userId, organizationId }
     * @param  {Function} cb
     */
    listAllUserPolicies: function listAllUserPolicies ({ userId, organizationId }, cb) {
      const sql = SQL`
          SELECT DISTINCT
            ON (id) id,
            version,
            name,
            statements
          FROM
            policies p
          LEFT JOIN
            user_policies up ON p.id = up.policy_id
          LEFT JOIN
            team_policies tp ON p.id = tp.policy_id
          LEFT JOIN
            organization_policies op ON p.id = op.policy_id
          WHERE
            up.user_id = ${userId} OR
            tp.team_id IN (
              SELECT team_id FROM teams WHERE path @> (
                SELECT array_agg(path) FROM teams
                INNER JOIN team_members tm
                ON tm.team_id = teams.id
                WHERE tm.user_id = ${userId}
              )
            ) OR
            op.org_id = ${organizationId}
      `

      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        cb(null, result.rows.map(mapping.policy.iam))
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

        return cb(null, result.rows.map(mapping.policy))
      })
    },

    /**
     * fetch specific policy
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    readPolicy: function readPolicy ({ id, organizationId }, cb) {
      const sqlQuery = SQL`
        SELECT  *
        FROM policies
        WHERE id = ${id}
        AND org_id = ${organizationId}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, mapping.policy(result.rows[0]))
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

        policyOps.readPolicy({ id: result.rows[0].id, organizationId }, cb)
      })
    },

    /**
     * Update policy values
     *
     * @param  {Object}   params { id, organizationId, version, name, organizationId, statements }
     * @param  {Function} cb
     */
    updatePolicy: function updatePolicy (params, cb) {
      const { id, organizationId, version, name, statements } = params

      const sqlQuery = SQL`
        UPDATE policies
        SET
          version = ${version},
          name = ${name},
          statements = ${statements}
        WHERE
          id = ${id}
          AND org_id = ${organizationId}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        policyOps.readPolicy({ id, organizationId }, cb)
      })
    },

    /**
     * Delete a specific policy
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deletePolicy: function deletePolicy (params, cb) {
      const { id, organizationId } = params

      const tasks = [
        (job, next) => {
          job.id = id
          job.organizationId = organizationId
          next()
        },
        removePolicyFromUsers,
        removePolicyFromTeams,
        removePolicy
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) return cb(Boom.badImplementation(err))
        cb()
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
        const sqlQuery = SQL`
          SELECT id
          FROM policies
          WHERE org_id = ${organizationId}
          AND name = ${name}
        `
        client.query(sqlQuery, function (err, result) {
          if (err) return cb(err)
          if (result.rowCount === 0) return cb(new Error(`No policy found for org ${organizationId} with name ${name}`))

          cb(null, result.rows[0].id)
        })
      })
    },

    createTeamDefaultPolicies: function createTeamDefaultPolicies (client, organizationId, teamId, cb) {
      const defaultPolicies = config.get('authorization.teams.defaultPolicies', { organizationId, teamId })
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
