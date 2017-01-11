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
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    userOps.createUser(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 'testId', name: 'Mike Teavee', organizationId: 'WONKA', teams: [], policies: [] })

      userOps.deleteUser({ id: 'testId', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create and delete a user without specifying an id', (done) => {
    const userData = {
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    userOps.createUser(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Mike Teavee')
      expect(result.organizationId).to.equal('WONKA')
      expect(result.teams).to.equal([])
      expect(result.policies).to.equal([])

      userOps.deleteUser({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create user in not existing organization', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'DO_NOT_EXIST_ORG'
    }
    userOps.createUser(userData, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('update a user', (done) => {
    const expected = { id: 'AugustusId', name: 'Augustus Gloop', organizationId: 'WONKA', teams: [{ id: '4', name: 'Managers' }], policies: [] }
    const data = {
      id: 'AugustusId',
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
    const expected = { id: 'VerucaId', name: 'Veruca Salt', organizationId: 'WONKA', teams: [{ id: '3', name: 'Authors' }, { id: '2', name: 'Readers' }], policies: [{ id: 'policyId2', version: '0.1', name: 'Accountant' }] }
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('getUserOrganizationId', (done) => {
    const expected = 'WONKA'
    userOps.getUserOrganizationId('VerucaId', (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user that does not exist', (done) => {
    userOps.readUser({ id: '987654321', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('replace user\'s policies', (done) => {
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }])

      userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId1', 'policyId3'], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 'policyId1', name: 'Director', version: '0.1' }, { id: 'policyId3', name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId2'], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies to user', (done) => {
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }])

      userOps.addUserPolicies({ id: 'VerucaId', policies: ['policyId1', 'policyId3'], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }, { id: 'policyId1', name: 'Director', version: '0.1' }, { id: 'policyId3', name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId2'], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add twice the same policy to a user', (done) => {
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }])

      userOps.addUserPolicies({ id: 'VerucaId', policies: ['policyId1', 'policyId2', 'policyId3'], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }, { id: 'policyId1', name: 'Director', version: '0.1' }, { id: 'policyId3', name: 'Sys admin', version: '0.1' }])

        userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId2'], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete user\'s policies', (done) => {
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }])

      userOps.deleteUserPolicies({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId2'], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete specific user\'s policy', (done) => {
    userOps.readUser({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([{ id: 'policyId2', name: 'Accountant', version: '0.1' }])

      userOps.deleteUserPolicy({ userId: 'VerucaId', policyId: 'policyId2', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        userOps.replaceUserPolicies({ id: 'VerucaId', policies: ['policyId2'], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })
})
