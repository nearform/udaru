'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const userOps = require('../../lib/ops/userOps')
const server = require('./../../wiring-hapi')

lab.experiment('Users', () => {

  lab.test('get user list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users',
      headers: {
        authorization: 'ROOTtoken',
        org: 'WONKA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.length).to.equal(7)
      expect(result[0]).to.equal({
        id: 5,
        name: 'Augustus Gloop',
        organizationId: 'WONKA',
        token: 'AugustusToken'
      })

      done()
    })
  })

  lab.test('get single user', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/AugustusToken'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 5,
        name: 'Augustus Gloop',
        organizationId: 'WONKA',
        token: 'AugustusToken',
        policies: [],
        teams: [
          {
            id: 1,
            name: 'Admins'
          }
        ]
      })

      done()
    })
  })

  lab.test('delete user should return 204 if success', (done) => {
    userOps.createUser({name: 'test', token: 'testToken', organizationId: 'ROOT'}, (err, user) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: '/authorization/users/testToken'
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(204)
        expect(result).to.be.undefined

        done()
      })
    })
  })

  lab.test('update user should return 200 for success', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyToken',
      payload: {
        name: 'Modify you',
        teams: []
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ id: 7,
        name: 'Modify you',
        token: 'ModifyToken',
        organizationId: 'WONKA',
        teams: [],
        policies: []
      })

      userOps.updateUser({ name: 'Modify Me', token: 'ModifyToken', organizationId: 'WONKA', teams: [] }, done)
    })
  })

  lab.test('add policies to a user', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyToken/policies',
      payload: {
        policies: [1]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.equal([{
        id: 1,
        name: 'Director',
        version: '0.1'
      }])

      userOps.deleteUserPolicies({ token: 'ModifyToken', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('clear and replace policies for a user', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyToken/policies',
      payload: {
        policies: [1]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.equal([{
        id: 1,
        name: 'Director',
        version: '0.1'
      }])

      options.payload.policies = [2, 3]
      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.policies).to.equal([
          {
            id: 2,
            name: 'Accountant',
            version: '0.1'
          },
          {
            id: 3,
            name: 'Sys admin',
            version: '0.1'
          }
        ])

        userOps.deleteUserPolicies({ token: 'ModifyToken', organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('remove all user\'s policies', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/ManyToken/policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)
      userOps.readUser({ id: 8, organizationId: 'WONKA' }, (err, user) => {
        expect(err).not.to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ token: 'ManyToken', organizationId: 'WONKA', policies: [10, 11, 12, 13, 14] }, done)
      })
    })
  })

  lab.test('remove one user\'s policies', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/ManyToken/policies/10'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(204)
      userOps.readUser({ id: 8, organizationId: 'WONKA' }, (err, user) => {
        expect(err).not.to.exist()
        expect(user.policies.map(p => p.id)).to.equal([14, 13, 12, 11])

        userOps.replaceUserPolicies({ token: 'ManyToken', organizationId: 'WONKA', policies: [10, 11, 12, 13, 14] }, done)
      })
    })
  })

  lab.test('create user for a non existent organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        token: 'U2FsbWFu'
      },
      headers: {
        authorization: 'ROOTtoken',
        org: 'DOES_NOT_EXISTS'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.equal({
        error: 'Bad Request',
        message: `Organization 'DOES_NOT_EXISTS' does not exists`,
        statusCode: 400
      })

      done()
    })
  })

  lab.test('create user for a specific organization being a SuperUser', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        token: 'U2FsbWFu'
      },
      headers: {
        authorization: 'ROOTtoken',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Salman')
      expect(result.token).to.equal('U2FsbWFu')
      expect(result.organizationId).to.equal('OILCOUSA')

      userOps.deleteUser({ token: 'U2FsbWFu', organizationId: 'OILCOUSA' }, done)
    })
  })

  lab.test('create user for the admin organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        token: 'U2FsbWFu'
      },
      headers: {
        authorization: 'ROOTtoken'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Salman')
      expect(result.token).to.equal('U2FsbWFu')
      expect(result.organizationId).to.equal('ROOT')

      userOps.deleteUser({ token: 'U2FsbWFu', organizationId: 'ROOT' }, done)
    })
  })

  lab.test('create user should return 400 bad request if input validation fails', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {}
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.include({
        statusCode: 400,
        error: 'Bad Request'
      })

      done()
    })
  })
})
