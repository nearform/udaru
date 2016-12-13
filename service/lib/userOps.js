'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL

module.exports = function (dbPool, log) {
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

    /**
     * Create a new user
     *
     * @param  {Object}   params { name, organizationId }
     * @param  {Function} cb
     */
    createUser: function createUser (params, cb) {
      const { name, organizationId } = params

      const sqlQuery = SQL`
        INSERT INTO users (
          id, name, org_id
        ) VALUES (
          DEFAULT, ${name}, ${organizationId}
        )
        RETURNING id
      `
      dbPool.query(sqlQuery, function (err, result) {
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

    /*
    * $1 = id, $2 = name, $3 = teams, $4 = policies
    */
    updateUser: function updateUser (args, cb) {
      const [id, name, teams, policies] = args
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query('UPDATE users SET name = $2 WHERE id = $1', [id, name], (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next(null, res)
          })
        })
        tasks.push((next) => { client.query('DELETE FROM team_members WHERE user_id = $1', [id], next) })

        if (teams.length > 0) {
          let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (team_id, user_id) VALUES ', teams.map(t => [t.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('DELETE FROM user_policies WHERE user_id = $1', [id], next) })

        if (policies.length > 0) {
          let stmt = dbUtil.buildInsertStmt('INSERT INTO user_policies (policy_id, user_id) VALUES ', policies.map(p => [p.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, {id, name, teams, policies})
        })
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

    /*
    * $1 = id
    */
    getUserByToken: function getUserByToken (userId, cb) {
      dbPool.query('SELECT id, name FROM users WHERE id = $1', [ userId ], function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        const user = result.rows[0]
        return cb(null, user)
      })
    }
  }

  return userOps
}
