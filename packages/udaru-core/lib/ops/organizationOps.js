'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Boom = require('boom')
const async = require('async')
const SQL = require('@nearform/sql')
const asyncify = require('../asyncify')
const mapping = require('../mapping')
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

  function updateOrgPolicies (job, next) {
    const { id, policies } = job

    organizationOps.updatePolicies(job.client, id, policies, utils.boomErrorWrapper(next))
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
    const { id, policyId, instance } = job

    const sqlQuery = SQL`
      DELETE FROM organization_policies
      WHERE org_id = ${id}
      AND policy_id = ${policyId}
    `

    if (instance) {
      sqlQuery.append(SQL`AND policy_instance = ${instance}`)
    }

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
    const { id, name, description, metadata } = job.params

    const sqlQuery = SQL`
      INSERT INTO organizations (
        id, name, description, metadata
      )
      VALUES (
        ${id}, ${name}, ${description}, ${metadata || null} 
      )
      RETURNING id
    `
    job.client.query(sqlQuery, function (err, res) {
      if (utils.isUniqueViolationError(err)) return next(Boom.conflict(err.detail))
      if (err) return next(Boom.badImplementation(err))

      job.organization = res.rows[0]
      next()
    })
  }

  function loadOrganizationPolicies (job, next) {
    const { id, offset, limit } = job

    const sql = SQL`
      SELECT pol.id, pol.name, pol.version, opol.variables, opol.policy_instance, COUNT(*) OVER() AS total_policies_count
      FROM organization_policies opol, policies pol
      WHERE opol.org_id = ${id}
      AND opol.policy_id = pol.id
      ORDER BY UPPER(pol.name)
    `
    if (limit) {
      sql.append(SQL` LIMIT ${limit}`)
    }
    if (offset) {
      sql.append(SQL` OFFSET ${offset}`)
    }

    job.client.query(sql, function (err, result) {
      if (err) return next(Boom.badImplementation(err))

      job.totalPoliciesCount = result.rowCount > 0 ? parseInt(result.rows[0].total_policies_count, 10) : 0
      job.organization.policiesCount = result.rowCount
      job.organization.policies = result.rows.map(mapping.policy.simple)
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

        userOps.insertPolicies(job.client, job.user.id, [{id: job.adminPolicyId, variables: {}}], utils.boomErrorWrapper(next))
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
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

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

      return promise
    },

    /**
     * Fetch data for an organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    readById: function readById (id, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

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
          SELECT pol.id, pol.name, pol.version, org_pol.variables, org_pol.policy_instance
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

      return promise
    },

    /**
     * Creates a new organization
     *
     * @param  {Object}   params {id, name, description, metadata, user} "metadata" optional
     * @param  {Object}   opts { createOnly }
     * @param  {Function} cb
     */
    create: function create (params, opts, cb) {
      if (!cb) {
        cb = opts
      }
      if (!opts || typeof opts === 'function') {
        opts = {}
      }

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { createOnly } = opts

      const tasks = [
        (job, next) => {
          const id = params.id || uuid()
          params.id = id
          const { name, description, metadata, user } = params

          Joi.validate({ id, name, description, metadata, user }, validationRules.create, (err) => {
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

      return promise
    },

    /**
     * Delete organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    deleteById: function deleteById (id, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

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

      return promise
    },

    /**
     * Updates all (for now) organization properties
     *
     * @param  {Object}   params {id, name, description, metadata} "metadata" optional
     * @param  {Function} cb
     */
    update: function update (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, name, description, metadata } = params

      Joi.validate({ id, name, description, metadata }, validationRules.update, (err) => {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          UPDATE organizations
          SET
            name = ${name},
            description = ${description},
            metadata = ${metadata || null}
          WHERE id = ${id}
        `
        db.query(sqlQuery, function (err, result) {
          if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
          if (err) return cb(Boom.badImplementation(err))
          if (result.rowCount === 0) return cb(Boom.notFound())

          organizationOps.readById(id, cb)
        })
      })

      return promise
    },

    /**
     * Replace organization policies
     *
     * @param  {Object}   params { id, policies }
     * @param  {Function} cb
     */
    replaceOrganizationPolicies: function replaceOrganizationPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

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

      return promise
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

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

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

      return promise
    },

    /**
     * Amends organization policies, (will only update items with instance specified)
     *
     * @param  {Object}   params { id, policies }
     * @param  {Function} cb
     */
    amendOrganizationPolicies: function amendOrganizationPolicies (params, cb) {
      const { id, policies } = params
      if (policies.length <= 0) {
        return organizationOps.readById(id, cb)
      }

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const tasks = [
        (job, next) => {
          Joi.validate({ id, policies }, validationRules.amendOrganizationPolicies, (err) => {
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
        insertOrgPolicies,
        updateOrgPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })

      return promise
    },

    /**
     * Rmove all organization's attached policies
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteOrganizationAttachedPolicies: function deleteOrganizationAttachedPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

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

      return promise
    },

    /**
     * Remove one organization policy
     *
     * @param  {Object}   params { id, policyId, instance } "instance" optional
     * @param  {Function} cb
     */
    deleteOrganizationAttachedPolicy: function deleteOrganizationAttachedPolicy (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, policyId, instance } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, policyId, instance }, validationRules.deleteOrganizationPolicy, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policyId = policyId
          job.instance = instance

          next()
        },
        checkOrg,
        clearOrganizationAttachedPolicy
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        organizationOps.readById(id, cb)
      })

      return promise
    },

    insertPolicies: function insertPolicies (client, id, policies, cb) {
      const newPolicies = _.filter(policies, function (p) { if (!p.instance) return true })

      if (newPolicies.length === 0) {
        if (typeof cb !== 'function') return Promise.resolve()

        return cb()
      }

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const sqlQuery = SQL`
        INSERT INTO organization_policies (
          policy_id, org_id, variables
        ) VALUES
      `
      sqlQuery.append(SQL`(${newPolicies[0].id}, ${id}, ${newPolicies[0].variables})`)
      newPolicies.slice(1).forEach((policy) => {
        sqlQuery.append(SQL`, (${policy.id}, ${id}, ${policy.variables})`)
      })
      sqlQuery.append(SQL` ON CONFLICT ON CONSTRAINT org_policy_link DO NOTHING`)

      client.query(sqlQuery, (err, result) => {
        if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
        if (err) return cb(Boom.badImplementation(err))
        return cb(null, result)
      })

      return promise
    },

    updatePolicies: function updatePolicies (client, orgId, policies, cb) {
      const policiesToUpdate = _.filter(policies, function (p) { if (p.instance) return true })

      if (policiesToUpdate.length === 0) {
        if (typeof cb !== 'function') return Promise.resolve()

        return cb()
      }

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const sqlQuery = SQL`
        UPDATE organization_policies AS opol SET variables = inst.variables FROM ( VALUES
      `
      sqlQuery.append(SQL`(${policiesToUpdate[0].id}, ${policiesToUpdate[0].instance}, ${orgId}, ${policiesToUpdate[0].variables}::JSONB) \n`)
      policiesToUpdate.slice(1).forEach((policy) => {
        sqlQuery.append(SQL`, (${policy.id}, ${policy.instance}, ${orgId}, ${policy.variables}::JSONB) \n`)
      })

      sqlQuery.append(SQL`) AS inst(policy_id, policy_instance, org_id, variables)  
        WHERE (opol.policy_id = inst.policy_id 
        AND opol.policy_instance::integer = inst.policy_instance::integer
        AND opol.org_id = inst.org_id);`) // constraint prevents insertion of policy with same variable set

      client.query(sqlQuery, (err, result) => {
        if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
        if (err) return cb(Boom.badImplementation(err))
        return cb(null, result)
      })

      return promise
    },

    /**
     * List an organizations policies
     *
     * @param  {Object}   params { id, organizationId, limit, page }
     * @param  {Function} cb
     */
    listOrganizationPolicies: function listOrganizationPolicies ({ id, organizationId, page = 1, limit }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      Joi.validate({ id, organizationId, page, limit }, validationRules.listOrganizationPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const offset = (page - 1) * limit
        const job = {
          id,
          organizationId,
          offset,
          limit,
          organization: {},
          client: db
        }

        loadOrganizationPolicies(job, (err) => {
          if (err) return cb(err)
          const pageSize = limit || job.totalPoliciesCount
          const result = {
            page: page,
            limit: pageSize,
            total: job.totalPoliciesCount,
            data: job.organization.policies
          }
          return cb(null, result)
        })
      })

      return promise
    }
  }

  organizationOps.list.validate = validationRules.list
  organizationOps.readById.validate = validationRules.readById
  organizationOps.create.validate = validationRules.create
  organizationOps.deleteById.validate = validationRules.deleteById
  organizationOps.update.validate = validationRules.update
  organizationOps.addOrganizationPolicies.validate = validationRules.addOrganizationPolicies
  organizationOps.amendOrganizationPolicies.validate = validationRules.amendOrganizationPolicies
  organizationOps.replaceOrganizationPolicies.validate = validationRules.replaceOrganizationPolicies
  organizationOps.deleteOrganizationAttachedPolicies.validate = validationRules.deleteOrganizationPolicies
  organizationOps.deleteOrganizationAttachedPolicy.validate = validationRules.deleteOrganizationPolicy
  organizationOps.listOrganizationPolicies.validate = validationRules.listOrganizationPolicies

  return organizationOps
}
module.exports = buildOrganizationOps
