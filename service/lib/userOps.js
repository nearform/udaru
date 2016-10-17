'use strict'
var dbUtil = require('./dbUtil')

// to run a query we can acquire a client from the pool,
// run a query on the client, and then return the client to the pool

function listUsers (pool, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT  * from users', function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      console.log(result.rows)
      return cb(null, result.rows)
    })
  })
}

function readUserById (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT id, name from users WHERE id = $1', args, function (err, result) {
      done() // release the client back to the pool
      if (err) return cb(err)
      console.log(result.rows)
      return cb(null, result.rows)
    })
  })
}

function deleteUserById (pool, args, cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('BEGIN', function (err) {
      if (err) return cb(dbUtil.rollback(client, done))
      process.nextTick(function () {
        client.query('DELETE from user_policies WHERE user_id = $1', args, function (err, result) {
          if (err) return cb(dbUtil.rollback(client, done))
          console.log(result.rows)
          client.query('DELETE from team_members WHERE user_id = $1', args, function (err, result) {
            if (err) return cb(dbUtil.rollback(client, done))
            console.log(result.rows)
            client.query('DELETE from users WHERE id = $1', args, function (err, result) {
              if (err) return cb(dbUtil.rollback(client, done))
              console.log(result.rows)
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
  listUsers: listUsers,
  readUserById: readUserById,
  deleteUserById: deleteUserById
}
