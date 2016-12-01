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
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        client.query('SELECT * from users ORDER BY UPPER(name)', function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(Boom.badImplementation(err))

          log.debug('listAllUsers: count of: %d', result.rowCount)

          return cb(null, result.rows)
        })
      })
    },

    /*
    * $1 = org_id
    */
    listOrgUsers: function listOrgUsers (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        client.query('SELECT  * from users WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(Boom.badImplementation(err))

          return cb(null, result.rows)
        })
      })
    },

    /*
    * $1 = name, $2 = org_id
    */
    createUser: function createUser (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        client.query('INSERT INTO users (id, name, org_id) VALUES (DEFAULT, $1, $2) RETURNING id', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(Boom.badImplementation(err))

          log.debug('create user result: %j', result)
          userOps.readUserById([result.rows[0].id], function (err, result) {
            if (err) return cb(err)

            return cb(null, result)
          })
        })
      })
    },

    /*
    * $1 = id, $2 = name, $3 = org_id
    * (allows passing in of ID for test purposes)
    */
    createUserById: function createUserById (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        client.query('INSERT INTO users (id, name, org_id) VALUES ($1, $2, $3)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(Boom.badImplementation(err))

          log.debug('create user result: %j', result)
          userOps.readUserById([args[0]], function (err, result) {
            if (err) return cb(err)

            return cb(null, result)
          })
        })
      })
    },

    /*
    * $1 = id
    */
    readUserById: function readUserById (args, cb) {
      var user = {
        'id': null,
        'name': null,
        teams: [],
        policies: []
      }

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        client.query('SELECT id, name from users WHERE id = $1', args, function (err, result) {
          if (err) {
            done() // release the client back to the pool
            return cb(Boom.badImplementation(err))
          }

          if (result.rowCount === 0) {
            done()
            return cb(Boom.notFound())
          }

          user.id = result.rows[0].id
          user.name = result.rows[0].name

          client.query('SELECT teams.id, teams.name from team_members mem, teams WHERE mem.user_id = $1 and mem.team_id = teams.id ORDER BY UPPER(teams.name)', args, function (err, result) {
            if (err) {
              done() // release the client back to the pool
              return cb(Boom.badImplementation(err))
            }

            result.rows.forEach(function (row) {
              user.teams.push(row)
            })

            client.query('SELECT pol.id, pol.version, pol.name from user_policies upol, policies pol WHERE upol.user_id = $1 and upol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
              done() // release the client back to the pool
              if (err) return cb(Boom.badImplementation(err))

              result.rows.forEach(function (row) {
                user.policies.push(row)
              })

              return cb(null, user)
            })
          })
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

        tasks.push((next) => {
          client.query('BEGIN', (err, res) => {
            if (err) return next(Boom.badImplementation(err))
            next()
          })
        })

        tasks.push((next) => {
          client.query('UPDATE users SET name = $2 WHERE id = $1', [id, name], (err, res) => {
            if (err) return next(Boom.badImplementation(err))
            if (res.rowCount === 0) return next(Boom.notFound())

            next(null, res)
          })
        })

        tasks.push((next) => {
          client.query('DELETE FROM team_members WHERE user_id = $1', [id], (err) => {
            if (err) return next(Boom.badImplementation(err))

            next()
          })
        })

        if (teams.length > 0) {
          tasks.push((next) => {
            let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (team_id, user_id) VALUES ', teams.map(p => [p.id, id]))
            client.query(stmt.statement, stmt.params, (err) => {
              if (err) return next(Boom.badImplementation(err))

              next()
            })
          })
        }

        tasks.push((next) => {
          client.query('DELETE FROM user_policies WHERE user_id = $1', [id], (err) => {
            if (err) return next(Boom.badImplementation(err))

            next()
          })
        })

        if (policies.length > 0) {
          tasks.push((next) => {
            let stmt = dbUtil.buildInsertStmt('INSERT INTO user_policies (policy_id, user_id) VALUES ', policies.map(p => [p.id, id]))
            client.query(stmt.statement, stmt.params, (err) => {
              if (err) return next(Boom.badImplementation(err))

              next()
            })
          })
        }

        tasks.push((next) => {
          client.query('COMMIT', (err) => {
            if (err) return next(Boom.badImplementation(err))

            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err)
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

        tasks.push((next) => {
          client.query('BEGIN', (err, res) => {
            if (err) return next(Boom.badImplementation(err))
            next()
          })
        })

        tasks.push((next) => {
          client.query('DELETE from user_policies WHERE user_id = $1', args, function (err, result) {
            if (err) return next(Boom.badImplementation(err))
            next()
          })
        })

        tasks.push((next) => {
          client.query('DELETE from team_members WHERE user_id = $1', args, function (err, result) {
            if (err) return next(Boom.badImplementation(err))
            next()
          })
        })

        tasks.push((next) => {
          client.query('DELETE from users WHERE id = $1', args, function (err, result) {
            if (err) return next(Boom.badImplementation(err))
            if (result.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })

        tasks.push((next) => {
          client.query('COMMIT', function (err, result) {
            if (err) return next(Boom.badImplementation(err))
            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err)
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
      dbPool.connect((err, client, done) => {
        if (err) return cb(Boom.badImplementation(err))

        client.query('SELECT id, name FROM users WHERE id = $1', [ userId ], (err, result) => {
          done()

          if (err) return cb(Boom.badImplementation(err))
          if (result.rowCount === 0) return cb(Boom.notFound())

          const user = result.rows[0]

          return cb(null, user)
        })
      })
    }
  }

  return userOps
}
