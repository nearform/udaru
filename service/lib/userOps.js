module.exports.listUsers =
  function listUsers (pool, cb) {
    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool
    pool.connect(function(err, client, done) {
      if (err) return cb(err)
      client.query('SELECT  * from users', function(err, result) {
        done() // release the client back to the pool
        if(err) return cb(err)
        console.log(result.rows)
        return cb(null, result.rows)
      })
    })
  }
