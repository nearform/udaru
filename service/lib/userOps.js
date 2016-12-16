'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL

module.exports = function (dbPool, log) {

  const updateUserInfo = (job, next) => {
    const { id, name, organizationId } = job

    const sqlQuery = SQL`
      UPDATE users
      SET name = ${name}
      WHERE id = ${id}
      AND org_id = ${organizationId}
    `
    job.client.query(sqlQuery, (err, result) => {
      if (err) {
        return next(err)
      }
      if (result.rowCount === 0) {
        return next(Boom.notFound())
      }

      next()
    })
  }

  const clearUserTeams = (job, next) => {
    const { id } = job

    const sqlQuery = SQL`
      DELETE FROM team_members
      WHERE user_id = ${id}
    `
    job.client.query(sqlQuery, next)
  }

  const addUserTeams = (job, next) => {
    const { id: userId, teams } = job

    const sqlQuery = SQL`
      INSERT INTO team_members (
        team_id, user_id
      ) VALUES
    `
    sqlQuery.append(SQL`(${teams[0].id}, ${userId})`)
    teams.slice(1).forEach((t) => {
      sqlQuery.append(SQL`, (${t.id}, ${userId})`)
    })

    job.client.query(sqlQuery, next)
  }

  const clearUserPolicies = (job, next) => {
    const { id } = job

    const sqlQuery = SQL`
      DELETE FROM user_policies
      WHERE user_id = ${id}
    `
    job.client.query(sqlQuery, next)
  }

  const removeUserPolicy = (job, next) => {
    const { id, policyId } = job

    const sqlQuery = SQL`
      DELETE FROM user_policies
      WHERE user_id = ${id}
      AND policy_id = ${policyId}
    `
    job.client.query(sqlQuery, next)
  }

  const insertUserPolicies = (job, next) => {
    const { id: userId, policies } = job

    const sqlQuery = SQL`
      INSERT INTO user_policies (
        policy_id, user_id
      ) VALUES
    `
    sqlQuery.append(SQL`(${policies[0].id}, ${userId})`)
    policies.slice(1).forEach((p) => {
      sqlQuery.append(SQL`, (${p.id}, ${userId})`)
    })

    job.client.query(sqlQuery, next)
  }

  const userOps = {
    /**
     * Get organization users, in alphabetical order
     *
     * @param  {Object}   params { organizationId }
     * @param  {Function} cb
     */
    listOrgUsers: function listOrgUsers (params, cb) {
      const { organizationId } = params

      const sqlQuery = SQL`
        SELECT  *
        FROM users
        WHERE org_id = ${organizationId}
        ORDER BY UPPER(name)
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    insertUser: function insertUser (client, name, organizationId, cb) {
      const sqlQuery = SQL`
        INSERT INTO users (
          id, name, org_id
        ) VALUES (
          DEFAULT, ${name}, ${organizationId}
        )
        RETURNING id
      `

      client.query(sqlQuery, cb)
    },

    /**
     * Create a new user
     *
     * @param  {Object}   params { name, organizationId }
     * @param  {Function} cb
     */
    createUser: function createUser (params, cb) {
      const { name, organizationId } = params

      userOps.insertUser(dbPool, name, organizationId, (err, result) => {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUser({ id: result.rows[0].id, organizationId }, cb)
      })
    },

    /**
     * Create a new user (allows passing in of ID for test purposes)
     *
     * @param  {Object}   params { id, name, organizationId }
     * @param  {Function} cb
     */
    createUserById: function createUserById (params, cb) {
      const { id, name, organizationId } = params

      const sqlQuery = SQL`
        INSERT INTO users (
          id, name, org_id
        ) VALUES (
          ${id}, ${name}, ${organizationId}
        )
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUser({ id, organizationId }, cb)
      })
    },

    /**
     * Return the user organizationId
     *
     * @param  {Number}   id
     * @param  {Function} cb
     */
    getUserOrganizationId: function getUserOrganizationId (id, cb) {
      const sqlQuery = SQL`
        SELECT org_id
        FROM users
        WHERE id = ${id}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0].org_id)
      })
    },

    /**
     * Get user details
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    readUser: function readUser (params, cb) {
      const { id, organizationId } = params
      const user = {
        id: id,
        name: null,
        organizationId,
        teams: [],
        policies: []
      }

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        const tasks = []

        tasks.push((next) => {
          const sqlQuery = SQL`
            SELECT id, name, org_id
            FROM users
            WHERE id = ${id}
            AND org_id = ${organizationId}
          `
          client.query(sqlQuery, (err, result) => {
            if (err) {
              return next(err)
            }

            if (result.rowCount === 0) {
              return next(Boom.notFound())
            }

            user.name = result.rows[0].name

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
          client.query(sqlQuery, (err, result) => {
            if (err) {
              return next(err)
            }

            user.teams = result.rows.map((row) => row)

            next()
          })
        })

        tasks.push((next) => {
          const sqlQuery = SQL`
            SELECT pol.id, pol.name, pol.version
            FROM user_policies user_pol, policies pol
            WHERE user_pol.user_id = ${id} AND user_pol.policy_id = pol.id
            ORDER BY UPPER(pol.name)
          `
          client.query(sqlQuery, (err, result) => {
            if (err) {
              return next(err)
            }

            user.policies = result.rows.map((row) => row)

            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) {
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, user)
        })
      })
    },

    /**
     * Update user details
     *
     * @param  {Object}   params { id, organizationId, name, teams }
     * @param  {Function} cb
     */
    updateUser: function updateUser (params, cb) {
      const { id, organizationId, name, teams } = params

      const tasks = [
        (job, next) => {
          job.id = id
          job.name = name
          job.teams = teams
          job.organizationId = organizationId

          next()
        },
        updateUserInfo
      ]

      tasks.push(clearUserTeams)
      if (teams.length > 0) {
        tasks.push(addUserTeams)
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id, organizationId }, cb)
      })
    },

    /**
     * Replace user poilicies
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    replaceUserPolicies: function replaceUserPolicies (params, cb) {
      const { id, organizationId, policies } = params
      const tasks = [
        (job, next) => {
          job.id = id
          job.organizationId = organizationId
          job.policies = policies

          next()
        },
        clearUserPolicies
      ]

      if (policies.length > 0) {
        tasks.push(insertUserPolicies)
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id, organizationId }, cb)
      })
    },

    /**
     * Add one or more policies to a user
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    addUserPolicies: function addUserPolicies (params, cb) {
      const { id, organizationId, policies } = params
      if (policies.length <= 0) {
        return userOps.readUser({ id, organizationId }, cb)
      }

      const tasks = [
        (job, next) => {
          job.id = id
          job.policies = policies

          next()
        },
        insertUserPolicies
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id, organizationId }, cb)
      })
    },

    /**
     * Rmove all user's policies
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteUserPolicies: function deleteUserPolicies (params, cb) {
      const { id, organizationId } = params
      const tasks = [
        (job, next) => {
          job.id = id

          next()
        },
        clearUserPolicies
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id, organizationId }, cb)
      })
    },

    /**
     * Rmove all user's policies
     *
     * @param  {Object}   params { userId, organizationId, policyId }
     * @param  {Function} cb
     */
    deleteUserPolicy: function deleteUserPolicy (params, cb) {
      const { userId, organizationId, policyId } = params
      const tasks = [
        (job, next) => {
          job.id = userId
          job.policyId = policyId

          next()
        },
        removeUserPolicy
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id: userId, organizationId }, cb)
      })
    },

    /**
     * Delete user
     *
     * @param  {params}   { id, organizationId }
     * @param  {Function} cb
     */
    deleteUser: function deleteUser (params, cb) {
      const { id, organizationId } = params
      const tasks = [
        (job, next) => {
          job.id = id
          next()
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM user_policies WHERE user_id = ${id}`

          job.client.query(sqlQuery, next)
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`

          job.client.query(sqlQuery, next)
        },
        (job, next) => {
          const sqlQuery = SQL`DELETE FROM users WHERE id = ${id} AND org_id = ${organizationId}`

          job.client.query(sqlQuery, (err, result) => {
            if (err) {
              return next(err)
            }
            if (result.rowCount === 0) {
              return next(Boom.notFound())
            }

            next()
          })
        }
      ]

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        cb()
      })
    }
  }

  return userOps
}
