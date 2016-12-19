'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL

module.exports = function (dbPool, log) {

  const updateUserInfo = (job, next) => {
    const { id, name } = job

    const sqlQuery = SQL`
      UPDATE users
      SET name = ${name}
      WHERE id = ${id}
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

  const addUserPolicies = (job, next) => {
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
     * Get all users, in alphabetical order
     *
     * @param  {Object}   params
     * @param  {Function} cb
     */
    listAllUsers: function listAllUsers (params, cb) {
      const sqlQuery = SQL`
        SELECT *
        FROM users
        ORDER BY UPPER(name)
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

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

        userOps.readUserById(result.rows[0].id, cb)
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

        userOps.readUserById(id, cb)
      })
    },

    /**
     * Get user details
     *
     * @param  {Number}   id
     * @param  {Function} cb
     */
    readUserById: function readUserById (id, cb) {
      const user = {
        id: null,
        name: null,
        teams: [],
        policies: []
      }

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        const tasks = []

        tasks.push((next) => {
          const sqlQuery = SQL`
            SELECT id, name
            FROM users
            WHERE id = ${id}
          `
          client.query(sqlQuery, (err, result) => {
            if (err) {
              return next(err)
            }

            if (result.rowCount === 0) {
              return next(Boom.notFound())
            }

            user.id = result.rows[0].id
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
     * @param  {Number}   id
     * @param  {Object}   params { name, teams, policies }
     * @param  {Function} cb
     */
    updateUser: function updateUser (id, params, cb) {
      const { name, teams, policies } = params

      const tasks = [
        (job, next) => {
          job.id = id
          job.name = name
          job.teams = teams
          job.policies = policies

          next()
        },
        updateUserInfo
      ]

      tasks.push(clearUserTeams)
      if (teams.length > 0) {
        tasks.push(addUserTeams)
      }

      tasks.push(clearUserPolicies)
      if (policies.length > 0) {
        tasks.push(addUserPolicies)
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        cb(null, { id, name, teams, policies })
      })
    },

    /**
     * Delete user
     *
     * @param  {Number}   id
     * @param  {Function} cb
     */
    deleteUserById: function deleteUserById (id, cb) {
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
          const sqlQuery = SQL`DELETE FROM users WHERE id = ${id}`

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
    },

    /**
     * Get user info by token
     *
     * @param  {String}   userId
     * @param  {Function} cb
     */
    getUserByToken: function getUserByToken (userId, cb) {
      const sqlQuery = SQL`
        SELECT id, name
        FROM users
        WHERE id = ${userId}
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) {
          return cb(Boom.badImplementation(err))
        }
        if (result.rowCount === 0) {
          return cb(Boom.notFound())
        }

        const user = result.rows[0]

        return cb(null, user)
      })
    }
  }

  return userOps
}
