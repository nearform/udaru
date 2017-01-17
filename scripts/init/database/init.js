'use strict'

var async = require('async')
var pg = require('pg')
var config = require('./../../../src/lib/config')

var pgConf = config.get('pgdb')
/** @see https://github.com/olalonde/pgtools/blob/master/index.js#L43 */
pgConf.database = 'postgres'

var client = new pg.Client(pgConf)

function connect (next) {
  client.connect(function (err) {
    if (err) throw next(err)

    next()
  })
}

function dropDb (next) {
  client.query('DROP DATABASE IF EXISTS "authorization"', function (err, result) {
    if (err) throw next(err)

    next()
  })
}

function createDb (next) {
  client.query('CREATE DATABASE "authorization"', function (err, result) {
    if (err) throw next(err)

    next()
  })
}

function dropAdminUser (next) {
  client.query('DROP USER IF EXISTS "admin"', function (err, result) {
    if (err) throw next(err)

    next()
  })
}

function createAdminUser (next) {
  client.query('CREATE USER "admin" WITH PASSWORD \'default\'', function (err, result) {
    if (err) throw next(err)

    next()
  })
}

async.series([
  connect,
  dropDb,
  createDb,
  dropAdminUser,
  createAdminUser
],
function (err) {
  if (err) console.log(err)

  client.end(function (err) {
    if (err) throw err

    console.log('Db init: done')
  })
})
