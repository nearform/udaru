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
    if (err) return cb(err)
    client.query('SELECT * from users ORDER BY UPPER(name)', function (err, result) {
      done() // release the client back to the pool
      rsc.log.debug('listAllUsers: count of: ', result.rowCount)
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* $1 = org_id
*/
function listOrgUsers (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  * from users WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* $1 = name, $2 = org_id
*/
function createUser (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('INSERT INTO users (id, name, org_id) VALUES (DEFAULT, $1, $2) RETURNING id', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      rsc.log.debug('create user result: ', result)
      readUserById(rsc, [result.rows[0].id], function (err, result) {
        if (err) return cb(err)
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
    if (err) return cb(err)
    client.query('INSERT INTO users (id, name, org_id) VALUES ($1, $2, $3)', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      rsc.log.debug('create user result: ', result)
      readUserById(rsc, [args[0]], function (err, result) {
        if (err) return cb(err)
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
    if (err) return cb(err)
    client.query('SELECT id, name from users WHERE id = $1', args, function (err, result) {
      if (err || (result.rowCount < 1)) {
        done() // release the client back to the pool
        return cb(err || new Error('not found'))
      }
      user.id = result.rows[0].id
      user.name = result.rows[0].name

      client.query('SELECT teams.id, teams.name from team_members mem, teams WHERE mem.user_id = $1 and mem.team_id = teams.id ORDER BY UPPER(teams.name)', args, function (err, result) {
        if (err) {
          done() // release the client back to the pool
          return cb(err)
        }
        result.rows.forEach(function (row) {
          user.teams.push(row)
        })
        client.query('SELECT pol.id, pol.version, pol.name from user_policies upol, policies pol WHERE upol.user_id = $1 and upol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(err)
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
    if (err) return cb(err)

    const [id, name, teams, policies] = args
    const task = []

    if (!Array.isArray(teams) || !Array.isArray(policies)) {
      done() // release the client back to the pool
      return cb()
    }

    task.push((cb) => {
      client.query('BEGIN', cb)
    })
    task.push((result, cb) => {
      client.query('UPDATE users SET name = $2 WHERE id = $1', [id, name], cb)
    })
    task.push((result, cb) => {
      client.query('DELETE FROM team_members WHERE user_id = $1', [id], cb)
    })
    task.push((result, cb) => {
      let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (team_id, user_id) VALUES ', teams.map(p => [p.id, id]))
      client.query(stmt.statement, stmt.params, cb)
    })
    task.push((result, cb) => {
      client.query('DELETE FROM user_policies WHERE user_id = $1', [id], cb)
    })
    task.push((result, cb) => {
      let stmt = dbUtil.buildInsertStmt('INSERT INTO user_policies (policy_id, user_id) VALUES ', policies.map(p => [p.id, id]))
      client.query(stmt.statement, stmt.params, cb)
    })
    async.waterfall(task, (err) => {
      if (err) return cb(dbUtil.rollback(client, done))
      client.query('COMMIT', done)
      return cb(null, {id, name, teams, policies})
    })
  })
}

/*
* $1 = id
*/
function deleteUserById (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('BEGIN', function (err) {
      if (err) return cb(dbUtil.rollback(client, done))
      process.nextTick(function () {
        client.query('DELETE from user_policies WHERE user_id = $1', args, function (err, result) {
          // TODO: need to ensure that a 'not found' response is returned here
          if (err) return cb(dbUtil.rollback(client, done))
          rsc.log.debug('delete user_policies result: ', result)
          client.query('DELETE from team_members WHERE user_id = $1', args, function (err, result) {
            if (err) return cb(dbUtil.rollback(client, done))
            rsc.log.debug('delete team_member result: ', result)
            client.query('DELETE from users WHERE id = $1', args, function (err, result) {
              if (err) return cb(dbUtil.rollback(client, done))
              rsc.log.debug('delete user result: ', result)
              client.query('COMMIT', done)
              return cb(null, result.rows)
            })
          })
        })
      })
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
  updateUser: updateUser
}
