'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Boom = require('boom')
const async = require('async')
const uuidV4 = require('uuid/v4')
const SQL = require('@nearform/sql')
const asyncify = require('../asyncify')
const mapping = require('../mapping')
const utils = require('./utils')
const validationRules = require('./validation').users

function buildUserOps (db, config) {
  function clearUserPolicies (job, next) {
    const { id } = job

    const sqlQuery = SQL`
      DELETE FROM user_policies
      WHERE user_id = ${id}
    `
    job.client.query(sqlQuery, utils.boomErrorWrapper(next))
  }

  function readUserTeams (job, next) {
    let { id, organizationId, limit, offset } = job
    let sqlQuery = SQL`
        SELECT
          teams.id,
          teams.name
        FROM teams
        LEFT JOIN team_members ON team_members.team_id = teams.id
        WHERE team_members.user_id = ${id} AND teams.org_id = ${organizationId}
        ORDER BY UPPER(name)
      `

    if (limit) {
      sqlQuery.append(SQL` LIMIT ${limit}`)
    }
    if (limit && offset) {
      sqlQuery.append(SQL` OFFSET ${offset}`)
    }

    job.client.query(sqlQuery, function (err, result) {
      if (err) return next(Boom.badImplementation(err))

      sqlQuery = SQL`
            SELECT COUNT(*)::INTEGER AS cnt
            FROM team_members
            WHERE user_id = ${id}
          `
      job.client.query(sqlQuery, function (err, countResult) {
        if (err) return next(Boom.badImplementation(err))

        job.user.teams = result.rows.map(mapping.team.simple)
        job.totalTeamsCount = countResult.rows[0].cnt

        return next()
      })
    })
  }

  function readUserPolicies (job, next) {
    const { id, offset, limit } = job

    const sql = SQL`
      SELECT pol.id, pol.name, pol.version, upol.variables, upol.policy_instance, COUNT(*) OVER() AS total_policies_count
      FROM user_policies upol, policies pol
      WHERE upol.user_id = ${id}
      AND upol.policy_id = pol.id
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
      job.user.policiesCount = result.rowCount
      job.user.policies = result.rows.map(mapping.policy.simple)
      next()
    })
  }

  function clearUserTeams (job, next) {
    const { id } = job

    const sqlQuery = SQL`
      DELETE FROM team_members
      WHERE user_id = ${id}
    `
    job.client.query(sqlQuery, utils.boomErrorWrapper(next))
  }

  function removeUserPolicy (job, next) {
    const { id, policyId, instance } = job

    let sqlQuery = SQL`
      DELETE FROM user_policies
      WHERE user_id = ${id}
      AND policy_id = ${policyId}
    `
    if (instance) {
      sqlQuery.append(SQL`AND policy_instance = ${instance}`)
    }

    job.client.query(sqlQuery, utils.boomErrorWrapper(next))
  }

  function checkUserOrg (job, next) {
    const { id, organizationId } = job

    utils.checkUserOrg(job.client, id, organizationId, next)
  }

  function insertUserPolicies (job, next) {
    const { id: userId, policies } = job
    userOps.insertPolicies(job.client, userId, policies, utils.boomErrorWrapper(next))
  }

  function updateUserPolicies (job, next) {
    const { id: userId, policies } = job
    userOps.updatePolicies(job.client, userId, policies, utils.boomErrorWrapper(next))
  }

  function insertUserTeams (job, next) {
    const { id: userId, teams } = job

    userOps.insertTeams(job.client, userId, teams, utils.boomErrorWrapper(next))
  }

  const userOps = {
    /**
     * Get organization users, in alphabetical order
     *
     * @param  {Object}   params { organizationId, page, limit }
     * @param  {Function} cb
     */
    listOrgUsers: function listOrgUsers (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      const { organizationId, page, limit } = params

      Joi.validate({ organizationId, page, limit }, validationRules.listOrgUsers, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          WITH total AS (
            SELECT COUNT(*)::INTEGER AS cnt
            FROM users
            WHERE org_id = ${organizationId}
          )
          SELECT *, t.cnt AS total
          FROM users
          INNER JOIN total AS t on 1=1
          WHERE org_id = ${organizationId}
          ORDER BY UPPER(name)
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
          return cb(null, result.rows.map(mapping.user), total)
        })
      })

      return promise
    },

    /**
     * Get user details
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    readUser: function readUser (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params
      let user

      const tasks = []

      tasks.push((next) => {
        Joi.validate({ id, organizationId }, validationRules.readUser, (err) => {
          if (err) return next(Boom.badRequest(err))
          next()
        })
      })

      tasks.push((next) => {
        const sqlQuery = SQL`
          SELECT id, name, org_id, metadata
          FROM users
          WHERE id = ${id}
          AND org_id = ${organizationId}
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))
          if (result.rowCount === 0) return next(Boom.notFound(`User ${id} not found`))

          user = mapping.user(result.rows[0])
          next()
        })
      })

      tasks.push((next) => {
        const sqlQuery = SQL`
          SELECT teams.id, teams.name
          FROM team_members mem, teams
          WHERE mem.user_id = ${id} AND mem.team_id = teams.id
          ORDER BY UPPER(teams.name)
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))

          user.teams = result.rows.map(mapping.team.simple)
          next()
        })
      })

      tasks.push((next) => {
        const sqlQuery = SQL`
          SELECT pol.id, pol.name, pol.version, user_pol.variables, user_pol.policy_instance
          FROM user_policies user_pol, policies pol
          WHERE user_pol.user_id = ${id} AND user_pol.policy_id = pol.id
          ORDER BY UPPER(pol.name)
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))

          user.policies = result.rows.map(mapping.policy.simple)
          next()
        })
      })

      async.series(tasks, (err) => {
        if (err) return cb(err)

        return cb(null, user)
      })

      return promise
    },

    /**
     * Create a new user
     *
     * @param  {Object}   params { id, name, organizationId, metadata } "id" & "metadata" can be null
     * @param  {Function} cb
     */
    createUser: function createUser (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, name, organizationId, metadata } = params

      Joi.validate({ id, name, organizationId }, validationRules.createUser, function (err) {
        if (err) return cb(Boom.badRequest(err))

        userOps.organizationExists(organizationId, (err, res) => {
          if (err) return cb(err)
          if (!res) return cb(Boom.badRequest(`Organization '${organizationId}' does not exist`))

          userOps.insertUser(db, { id, name, organizationId, metadata }, (err, result) => {
            if (err) return cb(err)

            userOps.readUser({ id: result.rows[0].id, organizationId }, utils.boomErrorWrapper(cb))
          })
        })
      })

      return promise
    },

    /**
     * Delete user
     *
     * @param  {Object}   { id, organizationId }
     * @param  {Function} cb
     */
    deleteUser: function deleteUser (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.deleteUser, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          next()
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM user_policies WHERE user_id = ${id}`

          job.client.query(sqlQuery, utils.boomErrorWrapper(next))
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`

          job.client.query(sqlQuery, utils.boomErrorWrapper(next))
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM users WHERE id = ${id} AND org_id = ${organizationId}`

          job.client.query(sqlQuery, (err, result) => {
            if (err) return next(Boom.badImplementation(err))
            if (result.rowCount === 0) return next(Boom.notFound(`User ${id} not found`))

            next()
          })
        }
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        cb()
      })

      return promise
    },

    /**
     * Update user details
     *
     * @param  {Object}   params { id, organizationId, name, metadata } "metadata" can be null
     * @param  {Function} cb
     */
    updateUser: function updateUser (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, name, metadata } = params

      Joi.validate({ id, organizationId, name, metadata }, validationRules.updateUser, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          UPDATE users
          SET name = ${name},
          metadata = ${metadata || null}
          WHERE id = ${id}
          AND org_id = ${organizationId}
        `
        db.query(sqlQuery, (err, result) => {
          if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
          if (err) return cb(Boom.badImplementation(err))
          if (result.rowCount === 0) return cb(Boom.notFound(`User ${id} not found`))

          userOps.readUser({ id, organizationId }, cb)
        })
      })

      return promise
    },

    /**
     * Replace user policies
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    replaceUserPolicies: function replaceUserPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, policies } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId, policies }, validationRules.replaceUserPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.organizationId = organizationId
          job.policies = utils.preparePolicies(policies)

          next()
        },
        checkUserOrg,
        clearUserPolicies
      ]

      if (policies.length > 0) {
        tasks.push((job, next) => {
          utils.checkPoliciesOrg(job.client, job.policies, job.organizationId, next)
        })
        tasks.push(insertUserPolicies)
      }

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Add one or more policies to a user
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    addUserPolicies: function addUserPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, policies } = params
      if (policies.length <= 0) {
        return userOps.readUser({ id, organizationId }, cb)
      }

      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId, policies }, validationRules.addUserPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policies = utils.preparePolicies(policies)
          job.organizationId = organizationId

          next()
        },
        checkUserOrg,
        (job, next) => {
          utils.checkPoliciesOrg(job.client, job.policies, job.organizationId, next)
        },
        insertUserPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Amends one or more user policies, (will only update items with instance specified)
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    amendUserPolicies: function amendUserPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, policies } = params
      if (policies.length <= 0) {
        return userOps.readUser({ id, organizationId }, cb)
      }

      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId, policies }, validationRules.amendUserPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.policies = utils.preparePolicies(policies)
          job.organizationId = organizationId

          next()
        },
        checkUserOrg,
        (job, next) => {
          utils.checkPoliciesOrg(job.client, job.policies, job.organizationId, next)
        },
        insertUserPolicies,
        updateUserPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Rmove all user's policies
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteUserPolicies: function deleteUserPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.deleteUserPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.organizationId = organizationId

          next()
        },
        checkUserOrg,
        clearUserPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Remove one user policy
     *
     * @param  {Object}   params { userId, organizationId, policyId }
     * @param  {Function} cb
     */
    deleteUserPolicy: function deleteUserPolicy (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { userId, organizationId, policyId, instance } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ userId, organizationId, policyId, instance }, validationRules.deleteUserPolicy, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = userId
          job.policyId = policyId
          job.organizationId = organizationId
          job.instance = instance

          next()
        },
        checkUserOrg,
        removeUserPolicy
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id: userId, organizationId }, cb)
      })

      return promise
    },

    /**
     * Insert a new user into the database
     *
     * @param  {Object}      client
     * @param  {String|null} options.id
     * @param  {String}      options.name
     * @param  {String}      options.organizationId
     * @param  {String}      options.metadata (optional)
     * @param  {Function}    cb
     */
    insertUser: function insertUser (client, { id, name, organizationId, metadata }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      id = id || uuidV4()

      const sqlQuery = SQL`
        INSERT INTO users (
          id, name, org_id, metadata
        ) VALUES (
          ${id}, ${name}, ${organizationId}, ${metadata || null}
        )
        RETURNING id
      `

      client.query(sqlQuery, (err, result) => {
        if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
        if (err) return cb(Boom.badImplementation(err))

        cb(null, result)
      })

      return promise
    },

    insertTeams: function insertTeams (client, id, teams, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const sqlQuery = SQL`
        INSERT INTO team_members (
          team_id, user_id
        ) VALUES
      `
      sqlQuery.append(SQL`(${teams[0]}, ${id})`)
      teams.slice(1).forEach((policyId) => {
        sqlQuery.append(SQL`, (${policyId}, ${id})`)
      })
      sqlQuery.append(SQL` ON CONFLICT ON CONSTRAINT team_member_link DO NOTHING`)

      client.query(sqlQuery, utils.boomErrorWrapper(cb))

      return promise
    },

    insertPolicies: function insertPolicies (client, id, policies, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const newPolicies = _.filter(policies, function (p) { if (!p.instance) return true })

      if (newPolicies.length > 0) {
        const sqlQuery = SQL`
        INSERT INTO user_policies (
          policy_id, user_id, variables
        ) VALUES
      `
        sqlQuery.append(SQL`(${newPolicies[0].id}, ${id}, ${newPolicies[0].variables})`)
        newPolicies.slice(1).forEach((policy) => {
          sqlQuery.append(SQL`, (${policy.id}, ${id}, ${policy.variables})`)
        })
        sqlQuery.append(SQL` ON CONFLICT ON CONSTRAINT user_policy_link DO NOTHING`)

        client.query(sqlQuery, (err, result) => {
          if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
          if (err) return cb(Boom.badImplementation(err))
          cb(null, result)
        })
      } else {
        cb()
      }
      return promise
    },

    updatePolicies: function updatePolicies (client, id, policies, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      // we only want to update if instance value is set
      const policiesToUpdate = _.filter(policies, function (p) { if (p.instance) return true })

      if (policiesToUpdate.length > 0) {
        const sqlQuery = SQL`
          UPDATE user_policies AS upol SET variables = inst.variables FROM ( VALUES
        `
        sqlQuery.append(SQL`(${policiesToUpdate[0].id}, ${policiesToUpdate[0].instance}, ${id}, ${policiesToUpdate[0].variables}::JSONB) \n`)
        policiesToUpdate.slice(1).forEach((policy) => {
          sqlQuery.append(SQL`, (${policy.id}, ${policy.instance}, ${id}, ${policy.variables}::JSONB) \n`)
        })

        sqlQuery.append(SQL`) AS inst(policy_id, policy_instance, user_id, variables)  
          WHERE (upol.policy_id = inst.policy_id 
          AND upol.policy_instance::integer = inst.policy_instance::integer
          AND upol.user_id = inst.user_id);`) // constraint prevents insertion of policy with same variable set

        client.query(sqlQuery, (err, result) => {
          if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
          if (err) return cb(Boom.badImplementation(err))
          cb(null, result)
        })
      } else {
        cb()
      }
      return promise
    },

    organizationExists: function organizationExists (id, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const sqlQuery = SQL`
        SELECT id
        FROM organizations
        WHERE id = ${id}
      `
      db.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rowCount !== 0)
      })

      return promise
    },

    /**
     * Return the user organizationId
     *
     * @param  {Number}   id
     * @param  {Function} cb
     */
    getUserOrganizationId: function getUserOrganizationId (id, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const sqlQuery = SQL`
        SELECT org_id
        FROM users
        WHERE id = ${id}
      `
      db.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0].org_id)
      })

      return promise
    },

    /**
     * List the teams to which the user belongs to
     * Does not go recursively to parent teams
     *
     * @param  {Object}   params { id, organizationId, limit, page }
     * @param  {Function} cb
     */
    listUserTeams: function listUserTeams ({ id, organizationId, page = 1, limit }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      Joi.validate({ id, organizationId, page, limit }, validationRules.listUserTeams, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const offset = (page - 1) * limit
        const job = {
          id,
          organizationId,
          offset,
          limit,
          user: {},
          client: db
        }

        readUserTeams(job, (err) => {
          if (err) return cb(err)

          return cb(null, job.user.teams, job.totalTeamsCount)
        })
      })

      return promise
    },

    /**
     * List a users policies
     * Does not go recursively to parent teams
     *
     * @param  {Object}   params { id, organizationId, limit, page }
     * @param  {Function} cb
     */
    listUserPolicies: function listUserPolicies ({ id, organizationId, page = 1, limit }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      Joi.validate({ id, organizationId, page, limit }, validationRules.listUserPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const offset = (page - 1) * limit
        const job = {
          id,
          organizationId,
          offset,
          limit,
          user: {},
          client: db
        }

        readUserPolicies(job, (err) => {
          if (err) return cb(err)
          const pageSize = limit || job.totalPoliciesCount
          const result = {
            page: page,
            limit: pageSize,
            total: job.totalPoliciesCount,
            data: job.user.policies
          }
          return cb(null, result)
        })
      })

      return promise
    },

    /**
     * Return the user organizationId
     *
     * @param  {Object}   params { id, teams, organizationId }
     * @param  {Function} cb
     */
    replaceUserTeams: function replaceUserTeams (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, teams } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId, teams }, validationRules.replaceUserTeams, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.organizationId = organizationId
          job.teams = teams

          next()
        },
        checkUserOrg,
        (job, next) => {
          utils.checkTeamsOrg(job.client, job.teams, job.organizationId, next)
        },
        clearUserTeams,
        insertUserTeams
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Return the user organizationId
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteUserFromTeams: function deleteUserFromTeams (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.deleteUserFromTeams, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.id = id
          job.organizationId = organizationId

          next()
        },
        checkUserOrg,
        clearUserTeams
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) return cb(err)

        userOps.readUser({ id, organizationId }, cb)
      })

      return promise
    },

    // See https://www.postgresql.org/docs/current/static/textsearch.html
    search: function search (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      const { organizationId, query } = params
      Joi.validate({ organizationId, query }, validationRules.searchUser, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const sqlQuery = SQL`
          SELECT *
          FROM users
          WHERE org_id=${organizationId}
          AND (
            to_tsvector(name) @@ to_tsquery(${utils.toTsQuery(query)})
            OR name ILIKE(${'%' + query + '%'})
          )
          ORDER BY id;
        `
        db.query(sqlQuery, (err, result) => {
          if (err) return cb(Boom.badImplementation(err))
          return cb(null, result.rows.map(mapping.user), result.rows.length)
        })
      })

      return promise
    }
  }

  userOps.listOrgUsers.validate = validationRules.listOrgUsers
  userOps.readUser.validate = validationRules.readUser
  userOps.createUser.validate = validationRules.createUser
  userOps.deleteUser.validate = validationRules.deleteUser
  userOps.updateUser.validate = validationRules.updateUser
  userOps.replaceUserPolicies.validate = validationRules.replaceUserPolicies
  userOps.addUserPolicies.validate = validationRules.addUserPolicies
  userOps.amendUserPolicies.validate = validationRules.amendUserPolicies
  userOps.deleteUserPolicies.validate = validationRules.deleteUserPolicies
  userOps.deleteUserPolicy.validate = validationRules.deleteUserPolicy
  userOps.replaceUserTeams.validate = validationRules.replaceUserTeams
  userOps.listUserTeams.validate = validationRules.listUserTeams
  userOps.deleteUserFromTeams.validate = validationRules.deleteUserFromTeams
  userOps.search.validate = validationRules.searchUser
  userOps.listUserPolicies.validate = validationRules.listUserPolicies

  return userOps
}

module.exports = buildUserOps
