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
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    userOps.createUserById(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 99, name: 'Mike Teavee', organizationId: 'WONKA', teams: [], policies: [] })

      userOps.deleteUser({ id: 99, organizationId: 'WONKA' }, done)
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
      organizationId: 'WONKA'
    }
    userOps.createUser(userData, function (err, result) {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Grandma Josephine')

      userOps.deleteUser({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('update a user', (done) => {
    const expected = { id: 6, name: 'Augustus Gloop', organizationId: 'WONKA', teams: [{ id: 4, name: 'Managers' }], policies: [] }
    const data = {
      id: 6,
      organizationId: 'WONKA',
      name: 'Augustus Gloop',
      teams: [4]
    }

    userOps.updateUser(data, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      data.teams = [4, 5]
      userOps.updateUser(data, done)
    })
  })

  lab.test('read a specific user', (done) => {
    const expected = { id: 4, name: 'Veruca Salt', organizationId: 'WONKA', teams: [{ id: 3, name: 'Authors' }, { id: 2, name: 'Readers' }], policies: [{ id: 2, version: '0.1', name: 'Accountant' }] }
    userOps.readUser({ id: 4, organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('getUserOrganizationId', (done) => {
    const expected = 'WONKA'
    userOps.getUserOrganizationId(4, (err, result) => {
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

      userOps.replaceUserPolicies({ id: 4, policies: [1, 3], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 1, name: 'Director', version: '0.1' }, { id: 3, name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ id: 4, policies: [2], organizationId: 'WONKA' }, (err, user) => {
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

      userOps.addUserPolicies({ id: 4, policies: [1, 3], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 2, name: 'Accountant', version: '0.1' }, { id: 1, name: 'Director', version: '0.1' }, { id: 3, name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ id: 4, policies: [2], organizationId: 'WONKA' }, (err, user) => {
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

      userOps.deleteUserPolicies({ id: 4, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ id: 4, policies: [2], organizationId: 'WONKA' }, (err, user) => {
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

      userOps.deleteUserPolicy({ userId: 4, policyId: 2, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ id: 4, policies: [2], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('list user\'actions by resource', (done) => {
    userOps.listActionsByResource({ id: 8, organizationId: 'WONKA', resources: [] }, (err, resources) => {
      expect(err).to.not.exist()
      expect(resources).to.exist()
      expect(resources).to.equal({
        '/myapp/users/*': [
          'Read'
        ],
        '/myapp/users/username': [
          'Read',
          'Delete',
          'Edit'
        ],
        '/myapp/teams/*': [
          'Read',
          'Delete',
          'Edit'
        ]
      })

      done()
    })
  })

  lab.test('list user\'actions by single resource', (done) => {
    userOps.listActionsByResource({ id: 8, organizationId: 'WONKA', resources: ['/myapp/users/*'] }, (err, resources) => {
      expect(err).to.not.exist()
      expect(resources).to.exist()
      expect(resources).to.equal({
        '/myapp/users/*': [
          'Read'
        ]
      })

      done()
    })
  })

  lab.test('list user\'actions by multiple resources', (done) => {
    userOps.listActionsByResource({ id: 8, organizationId: 'WONKA', resources: ['/myapp/users/*', '/myapp/teams/*'] }, (err, resources) => {
      expect(err).to.not.exist()
      expect(resources).to.exist()
      expect(resources).to.equal({
        '/myapp/users/*': [
          'Read'
        ],
        '/myapp/teams/*': [
          'Read',
          'Delete',
          'Edit'
        ]
      })

      done()
    })
  })
})
