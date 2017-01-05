'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const userOps = require('../../../lib/ops/userOps')

lab.experiment('UserOps', () => {

  lab.test('list of org users', (done) => {
    userOps.listOrgUsers({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(7)

      done()
    })
  })

  lab.test('create and delete a user by ID', (done) => {
    const userData = {
      id: 99,
      token: 'testtoken99',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    userOps.createUserById(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 99, name: 'Mike Teavee', token: 'testtoken99', organizationId: 'WONKA', teams: [], policies: [] })

      userOps.deleteUser({ token: 'testtoken99', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create user in not existing organization', (done) => {
    const userData = {
      id: 99,
      name: 'Mike Teavee',
      organizationId: 'DO_NOT_EXIST_ORG'
    }
    userOps.createUserById(userData, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('create a user (and delete it)', (done) => {
    const userData = {
      name: 'Grandma Josephine',
      token: 'testtokenGJ',
      organizationId: 'WONKA'
    }
    userOps.createUser(userData, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Grandma Josephine')

      userOps.deleteUser({ token: 'testtokenGJ', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('update a user', (done) => {
    const expected = { id: 5, name: 'Augustus Gloop updated', token: 'AugustusToken', organizationId: 'WONKA', teams: [{ id: 4, name: 'Managers' }], policies: [] }
    const data = {
      token: 'AugustusToken',
      organizationId: 'WONKA',
      name: 'Augustus Gloop updated',
      teams: [4]
    }

    userOps.updateUser(data, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      data.teams = [1]
      data.name = 'Augustus Gloop'
      data.token = 'AugustusToken'
      userOps.updateUser(data, done)
    })
  })

  lab.test('read a specific user', (done) => {
    const expected = { id: 4, name: 'Veruca Salt', token: 'VerucaToken', organizationId: 'WONKA', teams: [{ id: 3, name: 'Authors' }, { id: 2, name: 'Readers' }], policies: [{ id: 2, version: '0.1', name: 'Accountant' }] }
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('getUserOrganizationId', (done) => {
    const expected = 'WONKA'
    userOps.getUserOrganizationId('VerucaToken', (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user that does not exist', (done) => {
    userOps.readUser({ id: 987654321, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('replace user\'s policies', (done) => {
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }])

      userOps.replaceUserPolicies({ token: user.token, policies: [1, 3], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 1, name: 'Director', version: '0.1' }, { id: 3, name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ token: user.token, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies to user', (done) => {
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }])

      userOps.addUserPolicies({ token: user.token, policies: [1, 3], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }, { id: 1, name: 'Director', version: '0.1' }, { id: 3, name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ token: user.token, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add twice the same policy to a user', (done) => {
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }])

      userOps.addUserPolicies({ token: user.token, policies: [1, 2, 3], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }, { id: 1, name: 'Director', version: '0.1' }, { id: 3, name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ token: user.token, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete user\'s policies', (done) => {
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }])

      userOps.deleteUserPolicies({ token: user.token, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ token: user.token, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete specific user\'s policy', (done) => {
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }])

      userOps.deleteUserPolicy({ token: user.token, policyId: 2, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ token: user.token, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })
})
