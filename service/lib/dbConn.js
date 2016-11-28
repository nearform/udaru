const pg = require('pg')
const config = require('./config')

var pool = null

function create (log) {
  // this initializes a connection pool
  // it will keep idle connections open for a 30 seconds
  // and set a limit of maximum 10 idle clients
  pool = new pg.Pool(config.get('pgdb'))

  pool.on('error', function (err, client) {
    // if an error is encountered by a client while it sits idle in the pool
    // the pool itself will emit an error event with both the error and
    // the client which emitted the original error
    // this is a rare occurrence but can happen if there is a network partition
    // between your application and the database, the database restarts, etc.
    // and so you might want to handle it and at least log it out
    log.error(err, 'idle client error')
  })

  function shutdown (args, cb) {
    pool.connect(function (err, client, done) {
      if (err) return cb(err)
      client.query('SELECT now()', function (err, result) {
        if (err) log.error(err) // log and carry on regardless
        if (client.release) client.release()
        pool.end(function (err, done) {
          if (err) return cb(err)
          return cb(null, null)
        })
      })
    })
  }

  return {
    pool: pool,
    shutdown: shutdown
  }
}

module.exports = {
  create: create
}
