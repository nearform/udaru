
function rollback (client, done) {
  client.query('ROLLBACK', function (err) {
    // if there was a problem rolling back the query
    // something is seriously messed up.  Return the error
    // to the done function to close & remove this client from
    // the pool.  If you leave a client in the pool with an unaborted
    // transaction weird, hard to diagnose problems might happen.
    return done(err)
  })
}

module.exports = {
  rollback: rollback
}
