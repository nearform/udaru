'use strict'

const pg = require('pg')
const async = require('async')
const logger = require('./../logger')
const config = require('./../../config')

/** @see https://github.com/brianc/node-pg-pool#a-note-on-instances */
const pool = new pg.Pool(config.get('pgdb'))
pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  logger.error(err, 'idle client error')
})

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

function runTasks (job, next) {
  async.applyEachSeries(job.tasks, job, next)
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

function query (...args) {
  pool.query(...args)
}

function buildTransactionClient (job, next) {
  job.client = new TransactionClient(job.client)
  next()
}

function withTransaction (tasks, done) {
  const job = {
    client: pool,
    tasks: tasks
  }

  async.applyEachSeries([
    connect,
    beginTransaction,
    buildTransactionClient,
    runTasks,
    commitTransaction
  ], job, (err, res) => {
    if (err) return rollbackTransaction(job, err, done)
    done(null, job)
  })
}

function TransactionClient (client) {
  return {
    query: function query (...args) {
      client.query(...args)
    },

    withTransaction: function withTransaction (tasks, done) {
      const job = {
        client: client,
        tasks: tasks
      }

      runTasks(job, done)
    }
  }
}

function shutdown (cb) {
  pool.connect(function (err, client, done) {
    if (err) return cb(err)
    client.query('SELECT now()', function (err, result) {
      if (err) logger.error(err) // log and carry on regardless
      if (client.release) client.release()
      pool.end(function (err, done) {
        if (err) return cb(err)
        return cb(null, null)
      })
    })
  })
}

const db = {
  shutdown: shutdown,
  query: query,
  withTransaction: withTransaction
}

module.exports = db
