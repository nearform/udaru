'use strict'

const Joi = require('joi')
const Boom = require('boom')
const async = require('async')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')
const utils = require('./utils')
const validationRules = require('./validation').organizations
const uuid = require('uuid/v4')
const buildPolicyOps = require('./policyOps')
const buildUserOps = require('./userOps')

function buildOrganizationOps (db, config) {
  const policyOps = buildPolicyOps(db, config)
  const userOps = buildUserOps(db, config)

  function fetchOrganizationUsers (job, next) {
    const { id } = job

    job.client.query(SQL`SELECT id FROM users WHERE org_id = ${id}`, function (err, result) {
      if (err) return next(Boom.badImplementation(err))
      if (result.rowCount === 0) return next(null, [])

      job.usersParams = result.rows.map(r => r.id)
      next()
    })
  }

  function removeUsersFromTeams (job, next) {
    if (!job.usersParams || job.usersParams.length === 0) return next()

    job.client.query(SQL`DELETE FROM team_members WHERE user_id = ANY (${job.usersParams})`, utils.boomErrorWrapper(next))
  }

  function removeUsersPolicies (job, next) {
    if (!job.usersParams || job.usersParams.length === 0) return next()

    job.client.query(SQL`DELETE FROM user_policies WHERE user_id = ANY (${job.usersParams})`, utils.boomErrorWrapper(next))
  }

  function checkOrg (job, next) {
    const { id } = job

    utils.checkOrg(job.client, id, next)
  }

  function insertOrgPolicies (job, next) {
    const { id, policies } = job

    organizationOps.insertPolicies(job.client, id, policies, utils.boomErrorWrapper(next))
  }

  function fetchOrganizationTeams (job, next) {
    const { id } = job

    job.client.query(SQL`SELECT id FROM teams WHERE org_id = ${id}`, function (err, result) {
      if (err) return next(Boom.badImplementation(err))
      if (result.rowCount === 0) return next(null, [])

      job.teamsIds = result.rows.map(r => r.id)
      next()
    })
  }

  function removeTeamsPolicies (job, next) {
    if (!job.teamsIds || job.teamsIds.length === 0) return next()

    job.client.query(SQL`DELETE FROM team_policies WHERE team_id  = ANY (${job.teamsIds})`, utils.boomErrorWrapper(next))
  }

  function clearOrganizationAttachedPolicies (job, next) {
    job.client.query(SQL`DELETE FROM organization_policies WHERE org_id = ${job.id}`, utils.boomErrorWrapper(next))
  }

  function clearOrganizationAttachedPolicy (job, next) {
    const { id, policyId } = job

    const sqlQuery = SQL`
      DELETE FROM organization_policies
      WHERE org_id = ${id}
      AND policy_id = ${policyId}
    `
    job.client.query(sqlQuery, utils.boomErrorWrapper(next))
  }

  function deleteOrganizationPolicies (job, next) {
    job.client.query(SQL`DELETE FROM policies WHERE org_id = ${job.id}`, utils.boomErrorWrapper(next))
  }

  function deleteOrganizationTeams (job, next) {
    job.client.query(SQL`DELETE FROM teams WHERE org_id = ${job.id}`, utils.boomErrorWrapper(next))
  }

  function deleteOrganizationUsers (job, next) {
    job.client.query(SQL`DELETE FROM users WHERE org_id = ${job.id}`, utils.boomErrorWrapper(next))
  }

  function deleteOrganization (job, next) {
    job.client.query(SQL`DELETE FROM organizations WHERE id = ${job.id}`, function (err, result) {
      if (err) return next(Boom.badImplementation(err))
      if (result.rowCount === 0) return next(Boom.notFound(`Organization ${job.id} not found`))

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
      if (utils.isUniqueViolationError(err)) {
        return next(Boom.badRequest(`Organization with id ${id} already present`))
      }
      if (err) return next(Boom.badImplementation(err))

      job.organization = res.rows[0]
      next()
    })
  }

  /**
   * Insert a new user and attach to it the organization admin policy
   *
   * @param  {Object}   job
   * @param  {Function} next
   */
  function insertOrgAdminUser (job, next) {
    if (job.user) {
      const { id, name } = job.user
      const { id: organizationId } = job.organization

      userOps.insertUser(job.client, { id, name, organizationId }, (err, res) => {
        if (err) return next(err)
        job.user.id = res.rows[0].id

        userOps.insertPolicies(job.client, job.user.id, [{id: job.adminPolicyId}], utils.boomErrorWrapper(next))
      })

      return
    }

    next()
  }

  function createDefaultPolicies (job, next) {
    policyOps.createOrgDefaultPolicies(job.client, job.organization.id, function (err, id) {
      if (err) return next(err)
      job.adminPolicyId = id
      next()
    })
  }

  const organizationOps = {
    /**
     * Fetch all organizations
     *
     * @param  {Object} params must contain both `limit` and `page` for pagination. Page is 1-indexed.
     * @param  {Function} cb
     */
    list: function list ({ limit, page }, cb) {
      Joi.validate({ limit, page }, validationRules.list, (err) => {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          WITH total AS (
            SELECT COUNT(*) AS cnt FROM organizations
          )
          SELECT o.*, t.cnt::INTEGER AS total
          FROM organizations AS o
          INNER JOIN total AS t ON 1=1
          ORDER BY UPPER(o.name)
        `

        if (limit) {
          sqlQuery.append(SQL` LIMIT ${limit}`)
        }
        if (limit && page) {
          let offset = (page - 1) * limit
          sqlQuery.append(SQL` OFFSET ${offset}`)
        }
        db.query(sqlQuery, function (err, result) {
          if (err) return cb(Boom.badImplementation(err))
          let total = result.rows.length > 0 ? result.rows[0].total : 0
          return cb(null, result.rows.map(mapping.organization), total)
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
      let organization
      const tasks = []

      tasks.push((next) => {
        Joi.validate(id, validationRules.readById, (err) => {
          if (err) return next(Boom.badRequest(err))
          next()
        })
      })

      tasks.push((next) => {
        const sqlQuery = SQL`
          SELECT *
          FROM organizations
          WHERE id = ${id}
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))
          if (result.rowCount === 0) return next(Boom.notFound(`Organization ${id} not found`))

          organization = mapping.organization(result.rows[0])
          next()
        })
      })

      tasks.push((next) => {
        const sqlQuery = SQL`
          SELECT pol.id, pol.name, pol.version, org_pol.variables
          FROM organization_policies org_pol, policies pol
          WHERE org_pol.org_id = ${id} AND org_pol.policy_id = pol.id
          ORDER BY UPPER(pol.name)
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))

          organization.policies = result.rows.map(mapping.policy.simple)
          next()
        })
      })

      async.series(tasks, (err) => {
        if (err) return cb(err)

        return cb(null, organization)
      })
    },

    /**
     * Creates a new organization
     *
     * @param  {Object}   params {id, name, description, user}
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
          const id = params.id || uuid()
          params.id = id
          const { name, description, user } = params

          Joi.validate({ id, name, description, user }, validationRules.create, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(res.organization.id, (err, organization) => {
          if (err) return cb(Boom.badImplementation(err))

          cb(null, { organization, user: res.user })
        })
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
          Joi.validate(id, validationRules.deleteById, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          next()
        },
        fetchOrganizationUsers,
        removeUsersFromTeams,
        removeUsersPolicies,
        fetchOrganizationTeams,
        removeTeamsPolicies,
        clearOrganizationAttachedPolicies,
        deleteOrganizationPolicies,
        deleteOrganizationTeams,
        deleteOrganizationUsers,
        deleteOrganization
      ]

      db.withTransaction(tasks, cb)
    },

    /**
     * Updates all (for now) organization properties
     *
     * @param  {Object}   params {id, name, description}
     * @param  {Function} cb
     */
    update: function update (params, cb) {
      const { id, name, description } = params

      Joi.validate({ id, name, description }, validationRules.update, (err) => {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          UPDATE organizations
          SET
            name = ${name},
            description = ${description}
          WHERE id = ${id}
        `
        db.query(sqlQuery, function (err, result) {
          if (err) return cb(Boom.badImplementation(err))
          if (result.rowCount === 0) return cb(Boom.notFound())

          organizationOps.readById(id, cb)
        })
      })
    },

    /**
     * Replace organization policies
     *
     * @param  {Object}   params { id, policies }
     * @param  {Function} cb
     */
    replaceOrganizationPolicies: function replaceOrganizationPolicies (params, cb) {
      const { id, policies } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, policies }, validationRules.replaceOrganizationPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policies = utils.preparePolicies(policies)

          next()
        },
        checkOrg,
        clearOrganizationAttachedPolicies
      ]

      if (policies.length > 0) {
        tasks.push((job, next) => {
          utils.checkPoliciesOrg(job.client, job.policies, job.id, next)
        })
        tasks.push(insertOrgPolicies)
      }

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })
    },

    /**
     * Add one or more policies to an organization
     *
     * @param  {Object}   params { id, policies }
     * @param  {Function} cb
     */
    addOrganizationPolicies: function addOrganizationPolicies (params, cb) {
      const { id, policies } = params
      if (policies.length <= 0) {
        return organizationOps.readById(id, cb)
      }

      const tasks = [
        (job, next) => {
          Joi.validate({ id, policies }, validationRules.addOrganizationPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policies = utils.preparePolicies(policies)

          next()
        },
        checkOrg,
        (job, next) => {
          utils.checkPoliciesOrg(job.client, job.policies, job.id, next)
        },
        insertOrgPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })
    },

    /**
     * Rmove all organization's attached policies
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteOrganizationAttachedPolicies: function deleteOrganizationAttachedPolicies (params, cb) {
      const { id } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id }, validationRules.deleteOrganizationPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id

          next()
        },
        checkOrg,
        clearOrganizationAttachedPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })
    },

    /**
     * Remove one organization policy
     *
     * @param  {Object}   params { id, policyId }
     * @param  {Function} cb
     */
    deleteOrganizationAttachedPolicy: function deleteOrganizationAttachedPolicy (params, cb) {
      const { id, policyId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, policyId }, validationRules.deleteOrganizationPolicy, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policyId = policyId

          next()
        },
        checkOrg,
        clearOrganizationAttachedPolicy
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })
    },

    insertPolicies: function insertPolicies (client, id, policies, cb) {
      if (policies.length === 0) return cb()

      const sqlQuery = SQL`
        INSERT INTO organization_policies (
          policy_id, org_id, variables
        ) VALUES
      `
      sqlQuery.append(SQL`(${policies[0].id}, ${id}, ${policies[0].variables})`)
      policies.slice(1).forEach((policy) => {
        sqlQuery.append(SQL`, (${policy.id}, ${id}, ${policy.variables})`)
      })
      sqlQuery.append(SQL` ON CONFLICT ON CONSTRAINT org_policy_link
        DO UPDATE SET variables = excluded.variables
        WHERE organization_policies.policy_id = excluded.policy_id
        AND organization_policies.org_id = excluded.org_id`)

      client.query(sqlQuery, utils.boomErrorWrapper(cb))
    }
  }

  organizationOps.list.validate = validationRules.list
  organizationOps.readById.validate = validationRules.readById
  organizationOps.create.validate = validationRules.create
  organizationOps.deleteById.validate = validationRules.deleteById
  organizationOps.update.validate = validationRules.update
  organizationOps.addOrganizationPolicies.validate = validationRules.addOrganizationPolicies
  organizationOps.replaceOrganizationPolicies.validate = validationRules.replaceOrganizationPolicies
  organizationOps.deleteOrganizationAttachedPolicies.validate = validationRules.deleteOrganizationPolicies
  organizationOps.deleteOrganizationAttachedPolicy.validate = validationRules.deleteOrganizationPolicy

  return organizationOps
}
module.exports = buildOrganizationOps
