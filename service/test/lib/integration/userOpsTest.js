'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const logger = require('pino')()

const UserOps = require('../../../lib/userOps')
const dbConn = require('../../../lib/dbConn')

const db = dbConn.create(logger)
const userOps = UserOps(db.pool, logger)

lab.experiment('UserOps', () => {

  lab.test('list of all users', (done) => {
    userOps.listAllUsers({}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(7)

      done()
    })
  })

  lab.test('list of org users', (done) => {
    userOps.listOrgUsers({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(6)

      done()
    })
  })

  lab.test('create and delete a user by ID', (done) => {
    const userData = {
      id: 99,
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    userOps.createUserById(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 99, name: 'Mike Teavee', organizationId: 'WONKA', teams: [], policies: [] })

      userOps.deleteUserById(99, done)
    })
  })

  lab.test('create a user (and delete it)', (done) => {
    const userData = {
      name: 'Grandma Josephine',
      organizationId: 'WONKA'
    }
    userOps.createUser(userData, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Grandma Josephine')

      userOps.deleteUserById(result.id, done)
    })
  })

  lab.test('update a user', (done) => {
    const expected = {id: 6, name: 'Augustus Gloop', teams: [{id: 4, name: 'Dream Team'}], policies: [{id: 1, name: 'DROP ALL TABLES!'}, {id: 2, name: 'THROW DESK'}]}
    const data = {
      name: 'Augustus Gloop',
      teams: [{ id: 4, name: 'Dream Team' }],
      policies: [{ id: 1, name: 'DROP ALL TABLES!' }, { id: 2, name: 'THROW DESK' }]
    }
    userOps.updateUser(6, data, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user', (done) => {
    const expected = {id: 4, name: 'Veruca Salt', organizationId: 'WONKA', teams: [{id: 3, name: 'Authors'}, {id: 2, name: 'Readers'}], policies: [{id: 2, version: '0.1', name: 'Accountant'}]}
    userOps.readUserById(4, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user that does not exist', (done) => {
    userOps.readUserById(987654321, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('read a specific user by token', (done) => {
    const expected = {id: 2, name: 'Charlie Bucket'}
    userOps.getUserByToken(2, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })
})
