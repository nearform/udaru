'use strict'
const dbUtil = require('./dbUtil')

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
  rsc.pool.connect((err, client, done) => {
    if (err) return cb(err)

    client.query('SELECT id, name, description from teams WHERE id = $1', args, (err, result) => {
      done() // release the client back to the pool

      if (err) return cb(err)
      if (result.rows.length === 0) return cb(null, {})

      const team = result.rows[0]

      return cb(null, team)
    })
  })
}

/*
* $1 = id
* $2 = name
* $3 = description
*/
// TODO: Allow updating specific fields only
function updateTeam (rsc, args, cb) {
  rsc.pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1 RETURNING id, name, description', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)

      const team = result.rows[0]

      return cb(null, team)
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
