'use strict'

const async = require('async')

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

function connect (job, next) {
  job.client.connect((err, conn, release) => {
    if (err) return next(err)
    job.client = conn
    job.release = release
    next()
  })
}

function beginTransaction (job, next) {
  job.client.query('BEGIN TRANSACTION', next)
}

function commitTransaction (job, next) {
  job.client.query('COMMIT', (err) => {
    job.release()
    next(err)
  })
}

function rollbackTransaction (job, originalError, next) {
  job.client.query('ROLLBACK', (err) => {
    job.release && job.release()
    next(err || originalError)
  })
}

function runTasks (job, next) {
  async.applyEachSeries(job.tasks, job, next)
}

function withTransaction (pool, tasks, done) {
  const job = {
    client: pool,
    tasks: tasks
  }

  async.applyEachSeries([
    connect,
    beginTransaction,
    runTasks,
    commitTransaction
  ], job, (err, res) => {
    if (err) return rollbackTransaction(job, err, done)
    done(null, job)
  })
}

function SQL (strings, ...values) {
  return new SqlStatement(strings, values)
}

class SqlStatement {

  constructor (strings, values) {
    this.strings = strings
    this.values = values
  }

  get text () {
    return this.strings.reduce((prev, curr, i) => prev + '$' + i + curr)
  }

  startsWith (...args) {
    return this.text.startsWith(args)
  }
}

module.exports = {
  rollback: rollback,
  buildInsertStmt: buildInsertStmt,
  withTransaction: withTransaction,
  SQL: SQL
}
