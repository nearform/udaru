'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const u = require('../../utils')
const { udaru } = u

lab.experiment('UserOps', () => {
  let wonkaTeams
  let wonkaPolicies

  lab.before(done => {
    udaru.teams.list({organizationId: 'WONKA'}, (err, teams) => {
      if (err) return done(err)
      wonkaTeams = teams

      udaru.policies.list({organizationId: 'WONKA'}, (err, policies) => {
        if (err) return done(err)
        wonkaPolicies = policies

        done()
      })
    })
  })

  lab.test('list of org users', (done) => {
    udaru.users.list({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      let expectedUserIds = [
        'AugustusId',
        'CharlieId',
        'ManyPoliciesId',
        'MikeId',
        'ModifyId',
        'VerucaId',
        'WillyId'
      ]
      expect(_.map(result, 'id')).contains(expectedUserIds)

      done()
    })
  })

  lab.test('create and delete a user by ID', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 'testId', name: 'Mike Teavee', organizationId: 'WONKA', teams: [], policies: [] })

      udaru.users.delete({ id: 'testId', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create and delete a user without specifying an id', (done) => {
    const userData = {
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Mike Teavee')
      expect(result.organizationId).to.equal('WONKA')
      expect(result.teams).to.equal([])
      expect(result.policies).to.equal([])

      udaru.users.delete({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create user in not existing organization', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'DO_NOT_EXIST_ORG'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('update a user', (done) => {
    const data = {
      id: 'AugustusId',
      organizationId: 'WONKA',
      name: 'Augustus Gloop new'
    }

    udaru.users.update(data, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Augustus Gloop new')

      udaru.users.update({ id: 'AugustusId', organizationId: 'WONKA', name: 'Augustus Gloop' }, done)
    })
  })

  lab.test('read a specific user', (done) => {
    let authorsTeam = u.findPick(wonkaTeams, {name: 'Authors'}, ['id', 'name'])
    let readersTeam = u.findPick(wonkaTeams, {name: 'Readers'}, ['id', 'name'])
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    const expected = {
      id: 'VerucaId',
      name: 'Veruca Salt',
      organizationId: 'WONKA',
      teams: [
        authorsTeam,
        readersTeam
      ],
      policies: [
        accountantPolicy
      ]
    }
    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('getUserOrganizationId', (done) => {
    const expected = 'WONKA'
    udaru.getUserOrganizationId('VerucaId', (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user that does not exist', (done) => {
    udaru.users.read({ id: '987654321', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('replace user\'s policies', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([accountantPolicy])

      udaru.users.replacePolicies({
        id: 'VerucaId',
        policies: [directorPolicy.id, sysadminPolicy.id],
        organizationId: 'WONKA'
      }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([directorPolicy, sysadminPolicy])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([accountantPolicy])

      udaru.users.addPolicies({ id: 'VerucaId', policies: [directorPolicy.id, sysadminPolicy.id], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([
          accountantPolicy,
          directorPolicy,
          sysadminPolicy
        ])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add twice the same policy to a user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([accountantPolicy])

      udaru.users.addPolicies({
        id: 'VerucaId',
        policies: [
          accountantPolicy.id,
          directorPolicy.id,
          sysadminPolicy.id
        ],
        organizationId: 'WONKA'
      }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([
          accountantPolicy,
          directorPolicy,
          sysadminPolicy
        ])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete user\'s policies', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([accountantPolicy])

      udaru.users.deletePolicies({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete specific user\'s policy', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(user.policies).to.equal([accountantPolicy])

      udaru.users.deletePolicy({ userId: 'VerucaId', policyId: accountantPolicy.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })
})
