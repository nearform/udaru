'use strict'

const async = require('async')

const dbUtil = require('./dbUtil')

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
function listAllUsers (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('SELECT * from users ORDER BY UPPER(name)', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(rsc.mu.error.badImplementation(err))

      rsc.log.debug('listAllUsers: count of: %d', result.rowCount)

      return cb(null, result.rows || [])
    })
  })
}

/*
* $1 = org_id
*/
function listOrgUsers (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('SELECT  * from users WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(rsc.mu.error.badImplementation(err))

      return cb(null, result.rows || [])
    })
  })
}

/*
* $1 = name, $2 = org_id
*/
function createUser (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('INSERT INTO users (id, name, org_id) VALUES (DEFAULT, $1, $2) RETURNING id', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(rsc.mu.error.badImplementation(err))

      rsc.log.debug('create user result: %j', result)
      readUserById(rsc, [result.rows[0].id], function (err, result) {
        if (err) return cb(rsc.mu.error.badImplementation(err))

        return cb(null, result)
      })
    })
  })
}

/*
* $1 = id, $2 = name, $3 = org_id
* (allows passing in of ID for test purposes)
*/
function createUserById (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('INSERT INTO users (id, name, org_id) VALUES ($1, $2, $3)', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(rsc.mu.error.badImplementation(err))

      rsc.log.debug('create user result: %j', result)
      readUserById(rsc, [args[0]], function (err, result) {
        if (err) return cb(rsc.mu.error.badImplementation(err))

        return cb(null, result)
      })
    })
  })
}

/*
* $1 = id
*/
function readUserById (rsc, args, cb) {
  var user = {
    'id': null,
    'name': null,
    teams: [],
    policies: []
  }

  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('SELECT id, name from users WHERE id = $1', args, function (err, result) {
      if (err) {
        done() // release the client back to the pool
        return cb(rsc.mu.error.badImplementation(err))
      }

      if (result.rowCount === 0) {
        done()
        return cb(rsc.mu.error.notFound())
      }

      user.id = result.rows[0].id
      user.name = result.rows[0].name

      client.query('SELECT teams.id, teams.name from team_members mem, teams WHERE mem.user_id = $1 and mem.team_id = teams.id ORDER BY UPPER(teams.name)', args, function (err, result) {
        if (err) {
          done() // release the client back to the pool
          return cb(rsc.mu.error.badImplementation(err))
        }

        result.rows.forEach(function (row) {
          user.teams.push(row)
        })

        client.query('SELECT pol.id, pol.version, pol.name from user_policies upol, policies pol WHERE upol.user_id = $1 and upol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(rsc.mu.error.badImplementation(err))

          result.rows.forEach(function (row) {
            user.policies.push(row)
          })

          return cb(null, user)
        })
      })
    })
  })
}

/*
* $1 = id, $2 = name, $3 = teams, $4 = policies
*/
function updateUser (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    const [id, name, teams, policies] = args
    const task = []

    if (!Array.isArray(teams) || !Array.isArray(policies)) {
      done() // release the client back to the pool
      return cb(rsc.mu.error.badRequest())
    }

    task.push((next) => {
      client.query('BEGIN', next)
    })

    task.push((next) => {
      client.query('UPDATE users SET name = $2 WHERE id = $1', [id, name], (err, res) => {
        if (err) return next(rsc.mu.error.badImplementation(err))
        if (res.rowCount === 0) return next(rsc.mu.error.notFound())

        next(null, res)
      })
    })

    task.push((next) => {
      client.query('DELETE FROM team_members WHERE user_id = $1', [id], (err) => {
        if (err) return next(rsc.mu.error.badImplementation(err))

        next()
      })
    })

    if (teams.length > 0) {
      task.push((next) => {
        let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (team_id, user_id) VALUES ', teams.map(p => [p.id, id]))
        client.query(stmt.statement, stmt.params, (err) => {
          if (err) return next(rsc.mu.error.badImplementation(err))

          next()
        })
      })
    }

    task.push((next) => {
      client.query('DELETE FROM user_policies WHERE user_id = $1', [id], (err) => {
        if (err) return next(rsc.mu.error.badImplementation(err))

        next()
      })
    })

    if (policies.length > 0) {
      task.push((next) => {
        let stmt = dbUtil.buildInsertStmt('INSERT INTO user_policies (policy_id, user_id) VALUES ', policies.map(p => [p.id, id]))
        client.query(stmt.statement, stmt.params, (err) => {
          if (err) return next(rsc.mu.error.badImplementation(err))

          next()
        })
      })
    }

    async.series(task, (err) => {
      if (err) {
        dbUtil.rollback(client, done)
        return cb(err)
      }

      client.query('COMMIT', (err) => {
        done()
        if (err) return cb(rsc.mu.error.badImplementation(err))

        return cb(null, {id, name, teams, policies})
      })
    })
  })
}

/*
* $1 = id
*/
function deleteUserById (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('BEGIN', (err) => {
      if (err) {
        dbUtil.rollback(client, done)
        return cb(rsc.mu.error.badImplementation(err))
      }

      process.nextTick(function () {
        client.query('DELETE from user_policies WHERE user_id = $1', args, function (err, result) {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(rsc.mu.error.badImplementation(err))
          }

          rsc.log.debug('delete user_policies result: %j', result)

          client.query('DELETE from team_members WHERE user_id = $1', args, function (err, result) {
            if (err) {
              dbUtil.rollback(client, done)
              return cb(rsc.mu.error.badImplementation(err))
            }

            rsc.log.debug('delete team_member result: %j', result)

            client.query('DELETE from users WHERE id = $1', args, function (err, result) {
              if (err) {
                dbUtil.rollback(client, done)
                return cb(rsc.mu.error.badImplementation(err))
              }

              if (result.rowCount === 0) {
                done()
                return cb(rsc.mu.error.notFound())
              }

              rsc.log.debug('delete user result: %j', result)

              client.query('COMMIT', (err) => {
                if (err) {
                  dbUtil.rollback(client, done)
                  return cb(rsc.mu.error.badImplementation(err))
                }

                done()
                return cb(null)
              })
            })
          })
        })
      })
    })
  })
}

/*
* $1 = id
*/
function getUserByToken (rsc, userId, cb) {
  rsc.pool.connect((err, client, done) => {
    if (err) return cb(rsc.mu.error.badImplementation(err))

    client.query('SELECT id, name FROM users WHERE id = $1', [ userId ], (err, result) => {
      done()

      if (err) return cb(rsc.mu.error.badImplementation(err))
      if (result.rowCount === 0) return cb(rsc.mu.error.notFound())

      const user = result.rows[0]

      return cb(null, user)
    })
  })
}

module.exports = {
  createUser: createUser,
  createUserById: createUserById,
  deleteUserById: deleteUserById,
  listAllUsers: listAllUsers,
  listOrgUsers: listOrgUsers,
  readUserById: readUserById,
  updateUser: updateUser,
  getUserByToken: getUserByToken
}
