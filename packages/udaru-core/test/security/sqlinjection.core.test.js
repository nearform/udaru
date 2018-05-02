'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const udaru = require('../..')()

const u = require('../testUtils')
const authorize = udaru.authorize

lab.experiment('UserOps injection tests', () => {
  let wonkaPolicies

  lab.before(done => {
    udaru.policies.list({ organizationId: 'WONKA' }, (err, policies) => {
      if (err) return done(err)
      wonkaPolicies = policies

      done()
    })
  })

  lab.test('control test - list of org users', (done) => {
    udaru.users.list({ organizationId: 'WONKA', page: 1, limit: 10 }, (err, result) => {
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

  lab.test('list of org users inject limit', (done) => {
    udaru.users.list({ organizationId: 'WONKA', page: 1, limit: '10 OR 1=1' }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('list of org users inject page', (done) => {
    udaru.users.list({ organizationId: 'WONKA', page: '1 OR 1 = 1', limit: 10 }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('list of org users inject organization ID', (done) => {
    udaru.users.list({ organizationId: '\'WONKA\' OR 1=1', page: 1, limit: 10 }, (err, result) => {
      expect(err).to.exist()

      done()
    })
  })

  lab.test('control test - add policies to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.addPolicies({ id: 'VerucaId', policies: [directorPolicy.id], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }, {
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [accountantPolicy.id], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('inject IDs at add policies to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.addPolicies({ id: '\'VerucaId\' AND 1=1', policies: [directorPolicy.id], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.exist()
        expect(user).to.not.exist()

        udaru.users.addPolicies({ id: 'VerucaId', policies: [directorPolicy.id], organizationId: '\'WONKA\' AND 1=1' }, (err, user) => {
          expect(err).to.exist()
          expect(user).to.not.exist()

          done()
        })
      })
    })
  })

  lab.test('inject policy at add policies to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.addPolicies({ id: 'VerucaId', policies: ['1 OR 1=1'], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.exist()
        expect(user).to.not.exist()

        udaru.users.addPolicies({ id: 'VerucaId', policies: [directorPolicy.id], organizationId: '\'WONKA\' AND 1=1' }, (err, user) => {
          expect(err).to.exist()
          expect(user).to.not.exist()

          done()
        })
      })
    })
  })

  lab.test('Check authorization should return access false', (done) => {
    authorize.isUserAuthorized({ userId: '\'ManyPoliciesId\' OR 1=1', resource: 'resource_a', action: 'action_a', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()

      done()
    })
  })

  lab.test('Check authorization should return access false', (done) => {
    authorize.isUserAuthorized({ userId: 'ManyPoliciesId', resource: 'resource_a', action: 'action_a', organizationId: '\'WONKA\' OR 1=1' }, (err, result) => {
      expect(err).to.exist()

      done()
    })
  })
})
