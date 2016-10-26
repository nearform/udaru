'use strict'
const dbUtil = require('./dbUtil')
const async = require('async')

/*
* no query args (but may e.g. sort in future)
*/
function listAllTeams (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, name, description from teams ORDER BY UPPER(name)', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* $1 = org_id
*/
function listOrgTeams (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  id, name, description from teams WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      return cb(null, result.rows)
    })
  })
}

/*
* $1 = name
* $2 = description
* $3 = team_parent_id
* $4 = org_id
*/
function createTeam (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('INSERT INTO teams (id, name, description, team_parent_id, org_id) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING id', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)

      const team = result.rows[0]

      readTeamById(rsc, [team.id], function (err, result) {
        if (err) return cb(err)
        return cb(null, result)
      })
    })
  })
}

/*
* $1 = id
*/
function readTeamById (rsc, args, cb) {
  const team = {
    'id': null,
    'name': null,
    'description': null,
    users: [],
    policies: []
  }
  rsc.pool.connect((err, client, done) => {
    if (err) return cb(err)

    client.query('SELECT id, name, description from teams WHERE id = $1', args, (err, result) => {
      if (err || (result.rowCount < 1)) {
        done() // release the client back to the pool
        return cb(err || new Error('not found'))
      }
      team.id = result.rows[0].id
      team.name = result.rows[0].name
      team.description = result.rows[0].description

      client.query('SELECT users.id, users.name from team_members mem, users WHERE mem.team_id = $1 and mem.user_id = users.id ORDER BY UPPER(users.name)', args, function (err, result) {
        if (err) {
          done() // release the client back to the pool
          return cb(err)
        }
        result.rows.forEach(function (row) {
          team.users.push(row)
        })
        client.query('SELECT pol.id, pol.version, pol.name from team_policies tpol, policies pol WHERE tpol.team_id = $1 and tpol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
          done() // release the client back to the pool
          if (err) return cb(err)
          result.rows.forEach(function (row) {
            team.policies.push(row)
          })
          return cb(null, team)
        })
      })
    })
  })
}

/*
* $1 = id
* $2 = name
* $3 = description
* $4 = users
* $5 = policies
*/
// TODO: Allow updating specific fields only
function updateTeam (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)

    const [ id, name, description, users, policies ] = args
    const task = []

    if (!Array.isArray(users) || !Array.isArray(policies)) {
      done()
      return cb(new Error('Users or policies data missing'))
    }

    task.push((cb) => {
      client.query('BEGIN', cb)
    })
    task.push((result, cb) => {
      client.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1', [id, name, description], cb)
    })
    task.push((result, cb) => {
      client.query('DELETE FROM team_members WHERE team_id = $1', [id], cb)
    })
    task.push((result, cb) => {
      let stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (user_id, team_id) VALUES ', users.map(p => [p.id, id]))
      client.query(stmt.statement, stmt.params, cb)
    })
    task.push((result, cb) => {
      client.query('DELETE FROM team_policies WHERE team_id = $1', [id], cb)
    })
    task.push((result, cb) => {
      let stmt = dbUtil.buildInsertStmt('INSERT INTO team_policies (policy_id, team_id) VALUES ', policies.map(p => [p.id, id]))
      client.query(stmt.statement, stmt.params, cb)
    })
    async.waterfall(task, (err) => {
      if (err) return cb(dbUtil.rollback(client, done))
      client.query('COMMIT', (err) => {
        if (err) return cb(err)
        done()
        return cb(null, {id, name, description, users, policies})
      })
    })
  })
}

/*
* $1 = id
*/
function deleteTeamById (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)

    client.query('BEGIN', function (err) {
      if (err) return cb(dbUtil.rollback(client, done))

      process.nextTick(function () {
        client.query('DELETE from team_members WHERE team_id = $1', args, function (err, result) {
          if (err) return cb(dbUtil.rollback(client, done))

          client.query('DELETE from team_policies WHERE team_id = $1', args, function (err, result) {
            if (err) return cb(dbUtil.rollback(client, done))

            client.query('DELETE from teams WHERE id = $1', args, function (err, result) {
              if (err) return cb(dbUtil.rollback(client, done))

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
  listAllTeams,
  listOrgTeams,
  createTeam,
  readTeamById,
  updateTeam,
  deleteTeamById
}
