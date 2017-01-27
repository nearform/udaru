'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

var proxyquire = require('proxyquire')
const logs = []

var client = {
  on: () => {},
  query: function (sql, callback) {
    logs.push(sql)
    callback()
  }
}

const tasks = [
  (job, next) => {
    const sql = `SELECT id FROM teams WHERE x=y AND z=w`
    job.client.query(sql, next)
  },
  (job, next) => {
    const sql = `DELETE FROM teams WHERE x=y AND z=w`
    job.client.query(sql, next)
  },
  (job, next) => {
    const sql = `INSERT INTO teams WHERE x=y AND z=w`
    job.client.query(sql, next)
  }
]

const dbInit = proxyquire('../../../src/udaru/lib/db', {'pg': {
  Pool: function () {
    return client
  }
}})
const db = dbInit({})

lab.experiment('bd', () => {
  lab.beforeEach((done) => {
    logs.length = 0

    done()
  })

  lab.test('run simple query will call the pool.query helper method', (done) => {
    db.query('SELECT * FROM foo', function () {
      expect(logs.length).to.equal(1)
      expect(logs[0]).to.equal('SELECT * FROM foo')
      done()
    })
  })

  lab.test('run simple transaction', (done) => {
    client.connect = function (callback) {
      logs.push('connect')

      callback(null, { query: client.query }, () => { logs.push('release') })
    }

    db.withTransaction(tasks, function (err, res) {
      expect(err).to.not.exist()
      expect(res).to.be.object()
      expect(logs).to.equal([
        'connect',
        'BEGIN TRANSACTION',
        'SELECT id FROM teams WHERE x=y AND z=w',
        'DELETE FROM teams WHERE x=y AND z=w',
        'INSERT INTO teams WHERE x=y AND z=w',
        'COMMIT',
        'release'
      ])

      done()
    })
  })

  lab.test('run multiple transaction should ignore the nested ones', (done) => {
    client.connect = function (callback) {
      logs.push('connect')

      callback(null, { query: client.query }, () => { logs.push('release') })
    }

    tasks.push((job, next) => {
      const tasksNestedTrans = [
        (job, next) => {
          const sql = `DELETE FROM teams_nested WHERE x=y AND z=w`
          job.client.query(sql, next)
        },
        (job, next) => {
          const sql = `INSERT INTO teams_nested WHERE x=y AND z=w`
          job.client.query(sql, next)
        }
      ]
      job.client.withTransaction(tasksNestedTrans, next)
    })
    tasks.push((job, next) => {
      const sql = `DELETE FROM policies WHERE x=y AND z=w`
      job.client.query(sql, next)
    })
    tasks.push((job, next) => {
      const sql = `SELECT * FROM teams WHERE x=y AND z=w`
      job.client.query(sql, next)
    })

    db.withTransaction(tasks, function (err, res) {
      expect(err).to.not.exist()
      expect(res).to.be.object()
      expect(logs).to.equal([
        'connect',
        'BEGIN TRANSACTION',
        'SELECT id FROM teams WHERE x=y AND z=w',
        'DELETE FROM teams WHERE x=y AND z=w',
        'INSERT INTO teams WHERE x=y AND z=w',
        'DELETE FROM teams_nested WHERE x=y AND z=w',
        'INSERT INTO teams_nested WHERE x=y AND z=w',
        'DELETE FROM policies WHERE x=y AND z=w',
        'SELECT * FROM teams WHERE x=y AND z=w',
        'COMMIT',
        'release'
      ])

      done()
    })
  })
})
