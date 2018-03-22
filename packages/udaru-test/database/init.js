#!/usr/bin/env node

'use strict'

const async = require('async')
const pg = require('pg')
const minimist = require('minimist')
const argv = minimist(process.argv.slice(2))

const pgConf = {
  user: argv.user || 'postgres',
  database: argv.database || 'postgres',
  authDatabase: argv.authDatabase || 'authorization',
  password: argv.password || 'postgres',
  host: argv.host || 'localhost',
  port: argv.port || 5432,
  max: argv.max || 10,
  idleTimeoutMillis: argv.idleTimeoutMillis || 30000
}

const client = new pg.Client(pgConf)

function connect (next) {
  client.connect(next)
}

function dropDb (next) {
  if (/production/i.test(process.env.NODE_ENV)) {
    return next()
  }

  client.query(`DROP DATABASE IF EXISTS "${pgConf.authDatabase}"`, function (err, result) {
    if (err) return next(err)

    next()
  })
}

function createDb (next) {
  client.query(`CREATE DATABASE "${pgConf.authDatabase}"`, function (err, result) {
    if (err) return next(err)

    next()
  })
}

function init (cb) {
  async.series([
    connect,
    dropDb,
    createDb
  ],
  function (err1) {
    if (err1) console.error(err1)
    client.end(function (err2) {
      cb(err1 || err2)
      cb()
    })
  })
}

module.exports = init

if (require.main === module) {
  init((err) => {
    if (err) throw err
    else console.log('Db init: done')
  })
}
