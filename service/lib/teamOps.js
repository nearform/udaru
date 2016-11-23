'use strict'
const dbUtil = require('./dbUtil')
const async = require('async')

module.exports = function (dbPool, mu, log) {
  var TeamOps = {
    /*
    * no query args (but may e.g. sort in future)
    */
    listAllTeams: function listAllTeams (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(mu.error.badImplementation(err))

        client.query('SELECT  id, name, description from teams ORDER BY UPPER(name)', function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(mu.error.badImplementation(err))

          return cb(null, result.rows)
        })
      })
    },

    /*
    * $1 = org_id
    */
    listOrgTeams: function listOrgTeams (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(mu.error.badImplementation(err))

        client.query('SELECT  id, name, description from teams WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(mu.error.badImplementation(err))

          return cb(null, result.rows)
        })
      })
    },

    /*
    * $1 = name
    * $2 = description
    * $3 = team_parent_id
    * $4 = org_id
    */
    createTeam: function createTeam (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(mu.error.badImplementation(err))

        client.query('INSERT INTO teams (id, name, description, team_parent_id, org_id) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING id', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(mu.error.badImplementation(err))

          const team = result.rows[0]

          TeamOps.readTeamById([team.id], function (err, result) {
            if (err) return cb(mu.error.badImplementation(err))

            return cb(null, result)
          })
        })
      })
    },

    /*
    * $1 = id
    */
    readTeamById: function readTeamById (args, cb) {
      const team = {
        'id': null,
        'name': null,
        'description': null,
        users: [],
        policies: []
      }

      dbPool.connect((err, client, done) => {
        if (err) return cb(mu.error.badImplementation(err))

        client.query('SELECT id, name, description from teams WHERE id = $1', args, (err, result) => {
          if (err) {
            done() // release the client back to the pool
            return cb(mu.error.badImplementation(err))
          }

          if (result.rowCount === 0) {
            done()
            return cb(mu.error.notFound())
          }

          team.id = result.rows[0].id
          team.name = result.rows[0].name
          team.description = result.rows[0].description

          client.query('SELECT users.id, users.name from team_members mem, users WHERE mem.team_id = $1 and mem.user_id = users.id ORDER BY UPPER(users.name)', args, function (err, result) {
            if (err) {
              done() // release the client back to the pool
              return cb(mu.error.badImplementation(err))
            }

            result.rows.forEach(function (row) {
              team.users.push(row)
            })

            client.query('SELECT pol.id, pol.name from team_policies tpol, policies pol WHERE tpol.team_id = $1 and tpol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
              done() // release the client back to the pool
              if (err) return cb(mu.error.badImplementation(err))

              result.rows.forEach(function (row) {
                team.policies.push(row)
              })

              return cb(null, team)
            })
          })
        })
      })
    },

    /*
    * $1 = id
    * $2 = name
    * $3 = description
    * $4 = users
    * $5 = policies
    */
    // TODO: Allow updating specific fields only
    updateTeam: function updateTeam (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) {
          return cb(mu.error.badImplementation(err))
        }

        const [ id, name, description, users, policies ] = args
        const task = []

        if (!Array.isArray(users) || !Array.isArray(policies)) {
          done()
          return cb(mu.error.badRequest())
        }

        task.push((next) => {
          client.query('BEGIN', next)
        })

        task.push((next) => {
          client.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1', [id, name, description], (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(mu.error.notFound())

            next()
          })
        })

        task.push((next) => {
          client.query('DELETE FROM team_members WHERE team_id = $1', [id], (err) => {
            if (err) return next(mu.error.badImplementation(err))

            next()
          })
        })

        if (users.length > 0) {
          task.push((next) => {
            const stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (user_id, team_id) VALUES ', users.map(p => [p.id, id]))
            client.query(stmt.statement, stmt.params, (err) => {
              if (err) return next(mu.error.badImplementation(err))

              next()
            })
          })
        }

        task.push((next) => {
          client.query('DELETE FROM team_policies WHERE team_id = $1', [id], (err) => {
            if (err) return next(mu.error.badImplementation(err))

            next()
          })
        })

        if (policies.length > 0) {
          task.push((next) => {
            const stmt = dbUtil.buildInsertStmt('INSERT INTO team_policies (policy_id, team_id) VALUES ', policies.map(p => [p.id, id]))
            client.query(stmt.statement, stmt.params, (err) => {
              if (err) return next(mu.error.badImplementation(err))

              next()
            })
          })
        }

        async.series(task, (err) => {
          if (err) {
            dbUtil.rollback(client, done) // done here; release the client
            return cb(err)
          }

          client.query('COMMIT', (err) => {
            done()
            if (err) return cb(mu.error.badImplementation(err))

            return cb(null, {id, name, description, users, policies})
          })
        })
      })
    },

    /*
    * $1 = id
    */
    deleteTeamById: function deleteTeamById (args, cb) {
      dbPool.connect(function (err, client, done) {
        if (err) return cb(mu.error.badImplementation(err))


        client.query('BEGIN', (err) => {
          if (err) return cb(dbUtil.rollback(client, done))

          process.nextTick(() => {
            client.query('DELETE from team_members WHERE team_id = $1', args, (err, result) => {
              if (err) {
                dbUtil.rollback(client, done)
                return cb(mu.error.badImplementation(err))
              }

              client.query('DELETE from team_policies WHERE team_id = $1', args, (err, result) => {
                if (err) {
                  dbUtil.rollback(client, done)
                  return cb(mu.error.badImplementation(err))
                }

                client.query('DELETE from teams WHERE id = $1', args, (err, result) => {
                  if (err) {
                    dbUtil.rollback(client, done)
                    return cb(mu.error.badImplementation(err))
                  }

                  if (result.rowCount === 0) {
                    done()
                    return cb(mu.error.notFound())
                  }

                  log.debug('delete team result: %j', result)

                  client.query('COMMIT', (err) => {
                    if (err) {
                      dbUtil.rollback(client, done)
                      return cb(mu.error.badImplementation(err))
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
  }

  return TeamOps
}
