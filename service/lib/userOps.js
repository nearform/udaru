'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')

module.exports = function (dbPool, log) {
  var userOps = {
    //
    // TODO: take the org_id from the administrator credentials (or superadmin role?)
    //
    // TODO: check admin privs for permission
    //

    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool

    /*
    * no query args (but may e.g. sort in future)
    */
    listAllUsers: function listAllUsers (args, cb) {
      dbPool.query('SELECT * from users ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = org_id
    */
    listOrgUsers: function listOrgUsers (args, cb) {
      dbPool.query('SELECT  * from users WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = name, $2 = org_id
    */
    createUser: function createUser (args, cb) {
      dbPool.query('INSERT INTO users (id, name, org_id) VALUES (DEFAULT, $1, $2) RETURNING id', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUserById([result.rows[0].id], cb)
      })
    },

    /*
    * $1 = id, $2 = name, $3 = org_id
    * (allows passing in of ID for test purposes)
    */
    createUserById: function createUserById (args, cb) {
      dbPool.query('INSERT INTO users (id, name, org_id) VALUES ($1, $2, $3)', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUserById([args[0]], cb)
      })
    },

    /*
    * $1 = id
    */
    readUserById: function readUserById (args, cb) {
      const user = {
        'id': null,
        'name': null,
        teams: [],
        policies: []
      }
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => {
          client.query('SELECT id, name from users WHERE id = $1', args, function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            user.id = result.rows[0].id
            user.name = result.rows[0].name

            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT teams.id, teams.name from team_members mem, teams WHERE mem.user_id = $1 and mem.team_id = teams.id ORDER BY UPPER(teams.name)', args, function (err, result) {
            if (err) return next(err)
            result.rows.forEach(function (row) {
              user.teams.push(row)
            })
            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT pol.id, pol.name, pol.version from user_policies upol, policies pol WHERE upol.user_id = $1 and upol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
            if (err) return next(err)
            result.rows.forEach(function (row) {
              user.policies.push(row)
            })
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

      if (!Array.isArray(teams) || !Array.isArray(policies)) {
        return cb(Boom.badRequest())
      }

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

    /*
    * $1 = id
    */
    deleteUserById: function deleteUserById (args, cb) {
      const tasks = []
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => { client.query('DELETE from user_policies WHERE user_id = $1', args, next) })
        tasks.push((next) => { client.query('DELETE from team_members WHERE user_id = $1', args, next) })
        tasks.push((next) => {
          client.query('DELETE from users WHERE id = $1', args, function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })
        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null)
        })
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
