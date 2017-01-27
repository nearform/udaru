'use strict'

const Boom = require('boom')
const Joi = require('joi')
const async = require('async')
const db = require('./../db')
const config = require('./../config')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')
const utils = require('./utils')
const uuidV4 = require('uuid/v4')
const validationRules = require('./validation').policies

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
                 AND p.policy_id = ANY (${ids})`,
               utils.boomErrorWrapper(cb))
}

function deleteUsersAssociations (client, ids, orgId, cb) {
  client.query(SQL`
               DELETE FROM user_policies AS p
               USING users AS u
               WHERE u.id = p.user_id
                 AND p.policy_id = ANY (${ids})`,
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
   * List all the policies related to a specific organization
   *
   * @param  {Object}   params { organizationId, limit, page }
   * @param  {Function} cb
   */
  listByOrganization: function listByOrganization (params, cb) {
    const { organizationId, limit, page } = params

    Joi.validate({ organizationId, page, limit }, validationRules.listByOrganization, function (err) {
      if (err) return cb(Boom.badRequest(err))

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
    })
  },

  /**
   * fetch specific policy
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb
   */
  readPolicy: function readPolicy ({ id, organizationId }, cb) {
    Joi.validate({ id, organizationId }, validationRules.readPolicy, function (err) {
      if (err) return cb(Boom.badRequest(err))

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

    Joi.validate({ id, version, name, organizationId, statements }, validationRules.createPolicy, function (err) {
      if (err) return cb(Boom.badRequest(err))

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
    })
  },

  /**
   * Update policy values
   *
   * @param  {Object}   params { id, organizationId, version, name, statements }
   * @param  {Function} cb
   */
  updatePolicy: function updatePolicy (params, cb) {
    const { id, organizationId, version, name, statements } = params

    Joi.validate({ id, organizationId, version, name, statements }, validationRules.updatePolicy, function (err) {
      if (err) return cb(Boom.badRequest(err))

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
        Joi.validate({ id, organizationId }, validationRules.deletePolicy, (err) => {
          if (err) return next(Boom.badRequest(err))

          next()
        })
      },
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

  /**
   * List all user policies
   *
   * @param  {Object}   params { userId, organizationId }
   * @param  {Function} cb
   */
  listAllUserPolicies: function listAllUserPolicies ({ userId, organizationId }, cb) {
    const rootOrgId = config.get('authorization.superUser.organization.id')
    const sql = SQL`
      WITH user_teams AS (
        SELECT id FROM teams WHERE path @> (
          SELECT array_agg(path) FROM teams
          INNER JOIN team_members tm
          ON tm.team_id = teams.id
          WHERE tm.user_id = ${userId}
        )
      ),
      policies_from_teams AS (
        SELECT
          policy_id
        FROM
          team_policies
        WHERE
          team_id IN (SELECT id FROM user_teams)
      ),
      policies_from_user AS (
        SELECT
          policy_id
        FROM
          user_policies
        WHERE
          user_id = ${userId}
      ),
      policies_from_organization AS (
        SELECT
          policy_id
        FROM
          organization_policies
        WHERE
          org_id = ${organizationId}
      )
      SELECT
        id,
        version,
        name,
        statements
      FROM
        policies
      WHERE
        org_id IN (${organizationId}, ${rootOrgId})
      AND (
          id IN (SELECT policy_id FROM policies_from_user)
        OR
          id IN (SELECT policy_id FROM policies_from_teams)
        OR
          id IN (SELECT policy_id FROM policies_from_organization)
      )
    `

    db.query(sql, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))

      cb(null, result.rows.map(mapping.policy.iam))
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

policyOps.listByOrganization.validate = validationRules.listByOrganization
policyOps.readPolicy.validate = validationRules.readPolicy
policyOps.createPolicy.validate = validationRules.createPolicy
policyOps.updatePolicy.validate = validationRules.updatePolicy
policyOps.deletePolicy.validate = validationRules.deletePolicy

module.exports = policyOps
