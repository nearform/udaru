'use strict'

const Boom = require('boom')
const dbUtil = require('./dbUtil')
const async = require('async')

module.exports = function (dbPool, log) {
  var TeamOps = {
    /*
    * no query args (but may e.g. sort in future)
    */
    listAllTeams: function listAllTeams (args, cb) {
      dbPool.query('SELECT  id, name, description from teams ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = org_id
    */
    listOrgTeams: function listOrgTeams (args, cb) {
      dbPool.query('SELECT  id, name, description from teams WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = name
    * $2 = description
    * $3 = team_parent_id
    * $4 = org_id
    */
    createTeam: function createTeam (args, cb) {
      var team
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query('INSERT INTO teams (id, name, description, team_parent_id, org_id) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING id', args, function (err, result) {
            if (err) return next(err)

            team = result.rows[0]
            next()
          })
        })
        tasks.push((next) => { client.query('COMMIT', next) })
        tasks.push((next) => {
          TeamOps.readTeamById([team.id], function (err, result) {
            if (err) return next(err)

            team = result
            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, team)
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
      const tasks = []

      dbPool.connect((err, client, done) => {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => {
          client.query('SELECT id, name, description from teams WHERE id = $1', args, (err, result) => {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            team.id = result.rows[0].id
            team.name = result.rows[0].name
            team.description = result.rows[0].description
            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT users.id, users.name from team_members mem, users WHERE mem.team_id = $1 and mem.user_id = users.id ORDER BY UPPER(users.name)', args, function (err, result) {
            if (err) return next(err)

            result.rows.forEach(function (row) {
              team.users.push(row)
            })
            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT pol.id, pol.name, pol.version from team_policies tpol, policies pol WHERE tpol.team_id = $1 and tpol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
            if (err) return next(err)

            result.rows.forEach(function (row) {
              team.policies.push(row)
            })
            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))

          done()
          return cb(null, team)
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
      const [ id, name, description, users, policies ] = args
      const tasks = []

      if (!Array.isArray(users) || !Array.isArray(policies)) {
        return cb(Boom.badRequest())
      }

      dbPool.connect(function (err, client, done) {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1', [id, name, description], (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })
        tasks.push((next) => { client.query('DELETE FROM team_members WHERE team_id = $1', [id], next) })

        if (users.length > 0) {
          const stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (user_id, team_id) VALUES ', users.map(u => [u.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('DELETE FROM team_policies WHERE team_id = $1', [id], next) })

        if (policies.length > 0) {
          const stmt = dbUtil.buildInsertStmt('INSERT INTO team_policies (policy_id, team_id) VALUES ', policies.map(p => [p.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, {id, name, description, users, policies})
        })
      })
    },

    /*
    * $1 = id
    */
    deleteTeamById: function deleteTeamById (args, cb) {
      const tasks = []
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => { client.query('DELETE from team_members WHERE team_id = $1', args, next) })
        tasks.push((next) => { client.query('DELETE from team_policies WHERE team_id = $1', args, next) })
        tasks.push((next) => {
          client.query('DELETE from teams WHERE id = $1', args, (err, result) => {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            log.debug('delete team result: %j', result)

            next()
          })
        })
        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done) // done here; release the client
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb()
        })
      })
    }
  }

  return TeamOps
}
