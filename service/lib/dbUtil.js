'use strict'

const async = require('async')

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
    return this.strings.reduce((prev, curr, i) => prev + '$' + i + curr).replace(/^\s+/, '')
  }

  append (statement) {
    /* TODO: fix "Cannot assign to read only property '0' of object '[object Array]'"
     *
     * this.strings[this.strings.length - 1] += statement.strings[0]
     * this.strings.push.apply(this.strings, statement.strings.slice(1));
     */

    const last = this.strings[this.strings.length - 1]
    const [first, ...rest] = statement.strings

    this.strings = this.strings.slice(0, -1).concat(last + first, rest)
    this.values.push.apply(this.values, statement.values)

    return this
  }
}

module.exports = {
  withTransaction: withTransaction,
  SQL: SQL
}
