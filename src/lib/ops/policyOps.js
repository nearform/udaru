'use strict'

const Boom = require('boom')
const async = require('async')
const db = require('./../db')
const config = require('./../config')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')
const utils = require('./utils')
const uuidV4 = require('uuid/v4')

function toArrayWithId (policies) {
  if (Array.isArray(policies)) {
    return policies.map((p) => {
      p.id = p.id || uuidV4()

      return p
    })
  }

  return Object.keys(policies).map((pName) => {
    let p = policies[pName]
    p.id = p.id || uuidV4()

    return p
  })
}

function insertPolicies (client, policies, cb) {
  policies = toArrayWithId(policies)

  const sql = SQL`INSERT INTO policies (id, version, name, org_id, statements) VALUES `
  sql.append(SQL`(${policies[0].id}, ${policies[0].version}, ${policies[0].name}, ${policies[0].org_id}, ${policies[0].statements})`)
  policies.slice(1).forEach((policy) => {
    sql.append(SQL`, (${policy.id}, ${policy.version}, ${policy.name}, ${policy.org_id}, ${policy.statements})`)
  })
  sql.append(SQL` RETURNING id`)

  client.query(sql, cb)
}

function deletePolicies (client, ids, orgId, cb) {
  client.query(SQL`DELETE FROM policies WHERE id = ANY (${ids}) AND org_id=${orgId}`, utils.boomErrorWrapper(cb))
}

function deleteTeamsAssociations (client, ids, orgId, cb) {
  client.query(SQL`
               DELETE FROM team_policies AS p
               USING teams AS t
               WHERE t.id = p.team_id
                 AND p.policy_id = ANY (${ids})
                 AND t.org_id = ${orgId}`,
               utils.boomErrorWrapper(cb))
}

function deleteUsersAssociations (client, ids, orgId, cb) {
  client.query(SQL`
               DELETE FROM user_policies AS p
               USING users AS u
               WHERE u.id = p.user_id
                 AND p.policy_id = ANY (${ids})
                 AND u.org_id = ${orgId}`,
               utils.boomErrorWrapper(cb))
}

function getNames (policies) {
  return Object.keys(policies).map((key) => {
    return policies[key].name
  })
}

function removePolicyFromUsers (job, next) {
  const { id, organizationId } = job
  deleteUsersAssociations(job.client, [id], organizationId, next)
}

function removePolicyFromTeams (job, next) {
  const { id, organizationId } = job
  deleteTeamsAssociations(job.client, [id], organizationId, next)
}

function removePolicy (job, next) {
  const { id, organizationId } = job

  const sqlQuery = SQL`
    DELETE FROM policies
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `
  job.client.query(sqlQuery, (err, res) => {
    if (err) return next(Boom.badImplementation(err))
    if (res.rowCount === 0) return next(Boom.notFound(`Policy ${id} not found`))

    next()
  })
}

const policyOps = {

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

    db.query(sql, function (err, result) {
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
    const { organizationId, limit, page } = params

    const sqlQuery = SQL`
      WITH total AS (
        SELECT COUNT(*) AS cnt FROM policies
        WHERE org_id = ${organizationId}
      )
      SELECT
        p.id,
        p.version,
        p.name,
        p.statements,
        t.cnt::INTEGER AS total
      FROM policies AS p
      INNER JOIN total AS t ON 1=1
      WHERE p.org_id = ${organizationId}
      ORDER BY UPPER(p.name)
    `
    if (limit) {
      sqlQuery.append(SQL` LIMIT ${limit}`)
    }
    if (limit && page) {
      const offset = (page - 1) * limit
      sqlQuery.append(SQL` OFFSET ${offset}`)
    }
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))
      let total = result.rows.length > 0 ? result.rows[0].total : 0
      return cb(null, result.rows.map(mapping.policy), total)
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
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))
      if (result.rowCount === 0) return cb(Boom.notFound())

      return cb(null, mapping.policy(result.rows[0]))
    })
  },

  /**
   * Creates a new policy
   *
   * @param  {Object}   params { id, version, name, organizationId, statements }
   * @param  {Function} cb
   */
  createPolicy: function createPolicy (params, cb) {
    const { id, version, name, organizationId, statements } = params

    insertPolicies(db, [{
      id: id,
      version: version,
      name: name,
      org_id: organizationId,
      statements: statements
    }], (err, result) => {
      if (utils.isUniqueViolationError(err)) {
        return cb(Boom.badRequest(`Policy with id ${id} already present`))
      }
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
    db.query(sqlQuery, function (err, result) {
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

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)
      cb()
    })
  },

  deleteAllPolicyByIds: function deleteAllPolicyByIds (client, ids, orgId, next) {
    async.applyEachSeries([
      deleteTeamsAssociations,
      deleteUsersAssociations,
      deletePolicies
    ], client, ids, orgId, next)
  },

  createOrgDefaultPolicies: function createOrgDefaultPolicies (client, organizationId, cb) {
    const defaultPolicies = config.get('authorization.organizations.defaultPolicies', {'organizationId': organizationId})
    insertPolicies(client, defaultPolicies, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))

      const name = config.get('authorization.organizations.defaultPolicies.orgAdmin.name', {'organizationId': organizationId})
      const sqlQuery = SQL`
        SELECT id
        FROM policies
        WHERE org_id = ${organizationId}
          AND name = ${name}
      `
      client.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound(`No policy found for org ${organizationId} with name ${name}`))

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
    client.query(SQL`SELECT id FROM policies WHERE name = ANY(${names}) AND org_id = ${organizationId}`, utils.boomErrorWrapper(cb))
  }
}

module.exports = policyOps
