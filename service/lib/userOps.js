'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL

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
      dbPool.query('SELECT * FROM users ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = org_id
    */
    listOrgUsers: function listOrgUsers (args, cb) {
      const [ orgId ] = args
      const sql = SQL `
        SELECT *
        FROM users
        WHERE org_id = ${orgId}
        ORDER BY UPPER(name)
      `

      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
    * $1 = name, $2 = org_id
    */
    createUser: function createUser (args, cb) {
      const [ name, orgId ] = args
      const sql = SQL `
        INSERT INTO users (id, name, org_id)
        VALUES (DEFAULT, ${name}, ${orgId})
        RETURNING id
      `

      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUserById([result.rows[0].id], cb)
      })
    },

    /*
    * $1 = id, $2 = name, $3 = org_id
    * (allows passing in of ID for test purposes)
    */
    createUserById: function createUserById (args, cb) {
      const [ id, name, orgId ] = args
      const sql = SQL `
        INSERT INTO users (id, name, org_id)
        VALUES (${id}, ${name}, ${orgId})
      `

      dbPool.query(sql, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUserById([args[0]], cb)
      })
    },

    /*
    * $1 = id
    */
    readUserById: function readUserById (args, cb) {
      const [ id ] = args
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
          client.query(SQL `SELECT id, name FROM users WHERE id = ${id}`, function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            user.id = result.rows[0].id
            user.name = result.rows[0].name

            next()
          })
        })

        tasks.push((next) => {
          const sql = SQL `
            SELECT teams.id, teams.name
            FROM team_members mem, teams
            WHERE mem.user_id = ${id} and mem.team_id = teams.id
            ORDER BY UPPER(teams.name)
          `

          client.query(sql, function (err, result) {
            if (err) return next(err)
            result.rows.forEach(function (row) {
              user.teams.push(row)
            })
            next()
          })
        })

        tasks.push((next) => {
          const sql = SQL `
            SELECT pol.id, pol.name, pol.version
            FROM user_policies upol, policies pol
            WHERE upol.user_id = ${id} and upol.policy_id = pol.id
            ORDER BY UPPER(pol.name)
          `

          client.query(sql, function (err, result) {
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

      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query(SQL `UPDATE users SET name = ${name} WHERE id = ${id}`, (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next(null, res)
          })
        })
        tasks.push((next) => {
          client.query(SQL `DELETE FROM team_members WHERE user_id = ${id}`, next)
        })

        if (teams.length > 0) {
          let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (team_id, user_id) VALUES ', teams.map(t => [t.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query(SQL `DELETE FROM user_policies WHERE user_id = ${id}`, next) })

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
      const [ id ] = args
      const tasks = []
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => { client.query(SQL `DELETE from user_policies WHERE user_id = ${id}`, next) })
        tasks.push((next) => { client.query(SQL `DELETE from team_members WHERE user_id = ${id}`, next) })
        tasks.push((next) => {
          client.query(SQL `DELETE from users WHERE id = ${id}`, args, function (err, result) {
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
      dbPool.query(SQL `SELECT id, name FROM users WHERE id = ${userId}`, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        const user = result.rows[0]
        return cb(null, user)
      })
    }
  }

  return userOps
}
