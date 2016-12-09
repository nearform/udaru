
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

function buildInsertStmt (insert, rows) {
  const params = []
  const chunks = []
  rows.forEach(row => {
    const valueClause = []
    row.forEach(p => {
      params.push(p)
      valueClause.push('$' + params.length)
    })
    chunks.push('(' + valueClause.join(', ') + ')')
  })
  return {
    statement: insert + chunks.join(', '),
    params: params
  }
}

function SQL(parts, ...values) {
  return {
    text: parts.reduce((prev, curr, i) => prev+"$"+i+curr),
    values
  };
}

module.exports = {
  rollback: rollback,
  buildInsertStmt: buildInsertStmt,
  SQL: SQL
}
