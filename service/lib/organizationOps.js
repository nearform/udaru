'use strict'

const Boom = require('boom')
const dbUtil = require('./dbUtil')
const PolicyOps = require('./policyOps')
const SQL = dbUtil.SQL

function fetchOrganizationUsers (job, next) {
  const { id } = job

  job.client.query(SQL`SELECT id FROM users WHERE org_id = ${id}`, function (err, result) {
    if (err) return next(err)
    if (result.rowCount === 0) return next(null, [])

    job.usersParams = result.rows.map(r => r.id)
    next()
  })
}

function removeUsersFromTeams (job, next) {
  if (!job.usersParams || job.usersParams.length === 0) return next()

  job.client.query(SQL`DELETE FROM team_members WHERE user_id = ANY (${job.usersParams})`, next)
}

function removeUsersPolicies (job, next) {
  if (!job.usersParams || job.usersParams.length === 0) return next()

  job.client.query(SQL`DELETE FROM user_policies WHERE user_id = ANY (${job.usersParams})`, next)
}

function fetchOrganizationTeams (job, next) {
  const { id } = job

  job.client.query(SQL`SELECT id FROM teams WHERE org_id = ${id}`, function (err, result) {
    if (err) return next(err)
    if (result.rowCount === 0) return next(null, [])

    job.teamsIds = result.rows.map(r => r.id)
    next()
  })
}

function removeTeamsPolicies (job, next) {
  if (!job.teamsIds || job.teamsIds.length === 0) return next()

  job.client.query(SQL`DELETE FROM team_policies WHERE team_id  = ANY (${job.teamsIds})`, next)
}

function deleteOrganizationPolicies (job, next) {
  job.client.query(SQL`DELETE FROM policies WHERE org_id = ${job.id}`, next)
}

function deleteOrganizationTeams (job, next) {
  job.client.query(SQL`DELETE FROM teams WHERE org_id = ${job.id}`, next)
}

function deleteOrganizationUsers (job, next) {
  job.client.query(SQL`DELETE FROM users WHERE org_id = ${job.id}`, next)
}

function deleteOrganization (job, next) {
  job.client.query(SQL`DELETE FROM organizations WHERE id = ${job.id}`, function (err, result) {
    if (err) return next(err)
    if (result.rowCount === 0) return next(Boom.notFound())

    next()
  })
}

function insertOrganization (job, next) {
  const { id, name, description } = job.params
  const sqlQuery = SQL`
    INSERT INTO organizations (
      id, name, description
    )
    VALUES (
      ${id}, ${name}, ${description}
    )
    RETURNING id
  `
  job.client.query(sqlQuery, function (err, res) {
    if (err) return next(err)
    job.organization = res.rows[0]
    next()
  })
}

module.exports = function (dbPool, log) {
  const policyOps = PolicyOps(dbPool)

  function createDefaultPolicies (job, next) {
    policyOps.createOrgDefaultPolicies(job.client, job.organization.id, function (err, id) {
      if (err) return next(err)
      job.adminPolicyId = id
      next()
    })
  }

  /**
   * Insert a new user and attach to it the organization admin policy
   *
   * NOTE: we are not using userOps.createUser because we need to execute this operation in a transaction with the same client.
   *
   * @param  {Object}   job
   * @param  {Function} next
   */
  function insertOrgAdminUser (job, next) {
    if (job.user) {
      const insertUser = SQL`
        INSERT INTO users (
          id, name, org_id
        )
        VALUES (
          DEFAULT, ${job.user.name}, ${job.organization.id}
        )
        RETURNING id
      `
      job.client.query(insertUser, (err, res) => {
        if (err) return next(err)
        job.user.id = res.rows[0].id

        const insertUserPolicy = SQL`
          INSERT INTO user_policies (
            user_id, policy_id
          )
          VALUES (
            ${job.user.id}, ${job.adminPolicyId}
          )
        `
        job.client.query(insertUserPolicy, next)
      })

      return
    }

    next()
  }

  var organizationOps = {

    /**
     * Fetch all organizations
     *
     * @param  {Function} cb
     */
    list: function list (cb) {
      const sqlQuery = SQL`
        SELECT *
        FROM organizations
        ORDER BY UPPER(name)
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * Creates a new organization
     *
     * @param  {Object}   params {id, name, description}
     * @param  {Object}   opts { createOnly }
     * @param  {Function} cb
     */
    create: function create (params, opts, cb) {
      if (!cb) {
        cb = opts
        opts = {}
      }

      const { createOnly } = opts

      const tasks = [
        (job, next) => {
          job.params = params
          job.user = params.user
          next()
        },
        insertOrganization
      ]
      if (!createOnly) {
        tasks.push(
          createDefaultPolicies,
          insertOrgAdminUser
        )
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) return cb(Boom.badImplementation(err))

        organizationOps.readById(res.organization.id, (err, organization) => {
          if (err) return cb(Boom.badImplementation(err))

          cb(null, { organization, user: res.user })
        })
      })
    },

    /**
     * Fetch data for an organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    readById: function readById (id, cb) {
      const sqlQuery = SQL`
        SELECT *
        FROM organizations
        WHERE id = ${id}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /**
     * Delete organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    deleteById: function deleteById (id, cb) {
      const tasks = [
        (job, next) => {
          job.id = id
          next()
        },
        fetchOrganizationUsers,
        removeUsersFromTeams,
        removeUsersPolicies,
        fetchOrganizationTeams,
        removeTeamsPolicies,
        deleteOrganizationPolicies,
        deleteOrganizationTeams,
        deleteOrganizationUsers,
        deleteOrganization
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) return cb(Boom.badImplementation(err))
        cb()
      })
    },

    /**
     * Updates all (for now) organization properties
     *
     * @param  {Object}   params {id, name, description}
     * @param  {Function} cb
     */
    update: function update (params, cb) {
      const { id, name, description } = params
      const sqlQuery = SQL`
        UPDATE organizations
        SET
          name = ${name},
          description = ${description}
        WHERE id = ${id}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, { id, name, description })
      })
    }
  }

  return organizationOps
}
