'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const _ = require('lodash')

const testUtils = require('../utils')
const { udaru } = testUtils
const authorize = udaru.authorize

const fs = require('fs')
const path = require('path')

const organizationId = 'WONKA'
const testUserData = {
  name: 'Salman',
  organizationId
}
const updateUserData = {
  organizationId,
  name: 'Salman',
  teams: null
}

lab.experiment('AuthorizeOps', () => {
  let testUserId
  let testTeamId
  let wonkaPolicies
  let managersTeamId

  lab.before((done) => {
    udaru.teams.list({organizationId}, (err, teams) => {
      if (err) return done(err)

      let managersTeam = _.find(teams, {name: 'Managers'})
      managersTeamId = managersTeam.id

      udaru.policies.list({organizationId}, (err, policies) => {
        if (err) return done(err)

        wonkaPolicies = policies

        udaru.users.create(testUserData, (err, result) => {
          if (err) return done(err)
          testUserId = result.id
          updateUserData.id = testUserId

          udaru.teams.addUsers({ id: managersTeamId, users: [testUserId], organizationId }, (err, result) => {
            if (err) return done(err)

            udaru.users.replacePolicies({ id: testUserId, policies: [_.find(wonkaPolicies, {name: 'Director'}).id], organizationId }, done)
          })
        })
      })
    })
  })

  lab.after((done) => {
    udaru.users.delete({ id: testUserId, organizationId: 'WONKA' }, (err, res) => {
      if (err) return done(err)

      udaru.teams.delete({ id: testTeamId, organizationId }, done)
    })
  })

  lab.test('check authorization should return access true for allowed', (done) => {
    authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId }, (err, result) => {
      if (err) return done(err)

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.access).to.be.true()

      done()
    })
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards both in action and resource', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId5'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:dropTable', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        done()
      })
    })
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards only for resource', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Read', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        done()
      })
    })
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards only for action', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId7'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Delete', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        done()
      })
    })
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards for URL resource', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId8'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: '/my/site/i/should/read/this', action: 'Read', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        done()
      })
    })
  })

  lab.test('authorize isUserAuthorized - should return false if the policies has a wildcard on the resource but we are asking for the wrong action', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Write', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.false()

        done()
      })
    })
  })

  lab.test('authorize isUserAuthorized - should return false if the policies has a wildcard on the action but we are asking for the wrong resource', (done) => {
    udaru.users.replacePolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
      if (err) return done(err)

      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:notMyTable', action: 'database:Write', organizationId }, (err, result) => {
        if (err) return done(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.false()

        done()
      })
    })
  })

  lab.test('authorize listAuthorizations - get all user actions on a resource', (done) => {
    const testTeamName = 'Actors'
    const testTeamParent = null
    const testTeamDesc = 'Famous Actors'
    const tasks = []

    // set-up
    tasks.push((cb) => {
      testUtils.deleteUserFromAllTeams(testUserId, cb)
    })
    tasks.push((result, cb) => {
      udaru.users.deletePolicies({ id: testUserId, organizationId }, cb)
    })

    tasks.push((result, cb) => {
      udaru.teams.list({ organizationId }, (err, result) => {
        expect(result.length).to.equal(6)
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      const teamData = {
        name: testTeamName,
        description: testTeamDesc,
        parentId: testTeamParent,
        organizationId
      }
      udaru.teams.create(teamData, (err, result) => {
        expect(err).to.not.exist()
        testTeamId = result.id
        cb(err, result)
      })
    })

    // test for no permissions on the resource
    tasks.push((result, cb) => {
      authorize.listActions({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal([])

        cb(err, result)
      })
    })

    // test for team permissions on the resource
    tasks.push((result, cb) => {
      const teamData = {
        id: testTeamId,
        users: [testUserId],
        organizationId
      }
      udaru.teams.replaceUsers(teamData, cb)
    })

    tasks.push((result, cb) => {
      authorize.listActions({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet'])

        cb(err, result)
      })
    })

    // test for user permissions on the resource
    tasks.push((result, cb) => {
      testUtils.deleteUserFromAllTeams(testUserId, cb)
    })
    tasks.push((result, cb) => {
      udaru.users.replacePolicies({
        id: testUserId,
        policies: [_.find(wonkaPolicies, {name: 'Sys admin'}).id],
        organizationId
      }, cb)
    })

    tasks.push((result, cb) => {
      authorize.listActions({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet', 'finance:ImportBalanceSheet'])

        cb(err, result)
      })
    })

    // test for team and user permissions on the resource
    tasks.push((result, cb) => {
      udaru.teams.addUsers({ id: '1', users: [testUserId], organizationId }, cb)
    })
    tasks.push((result, cb) => {
      udaru.users.replacePolicies({
        id: testUserId,
        policies: [_.find(wonkaPolicies, {name: 'Finance Director'}).id],
        organizationId
      }, cb)
    })

    tasks.push((result, cb) => {
      authorize.listActions({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet', 'finance:EditBalanceSheet'])

        cb(err, result)
      })
    })

    async.waterfall(tasks, done)
  })
})

lab.experiment('AuthorizeOps - list and access with multiple policies', () => {
  let adminId
  let savedPolicies
  const organizationId = 'nearForm'

  lab.before((done) => {
    const policies = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/policies.json'), { encoding: 'utf8' }))

    udaru.organizations.create({ id: organizationId, name: 'nearForm', description: 'nearform description', user: { name: 'admin' } }, (err, res) => {
      if (err) return done(err)

      adminId = res.user.id

      const tasks = policies.map((policy, index) => {
        return (next) => {
          policy.organizationId = organizationId
          udaru.policies.create(policy, next)
        }
      })

      async.series(tasks, (err, res) => {
        if (err) return done(err)

        savedPolicies = res
        done()
      })
    })
  })

  lab.test('check list simple action', (done) => {
    udaru.users.replacePolicies({ id: adminId, organizationId, policies: [ savedPolicies[0].id ] }, (err, res) => {
      if (err) return done(err)

      authorize.listActions({
        userId: adminId,
        resource: 'FOO:orga:CLOUDCUCKOO:scenario:bau-1',
        organizationId
      }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.equal({ actions: ['FOO:scenario:read'] })

        done()
      })
    })
  })

  lab.test('check list simple action on multiple resources', (done) => {
    udaru.users.replacePolicies({
      id: adminId,
      organizationId,
      policies: [ savedPolicies[0].id, savedPolicies[1].id ]
    }, (err, res) => {
      if (err) return done(err)

      authorize.listActions({
        userId: adminId,
        resource: 'FOO:orga:CLOUDCUCKOO:scenario:TEST:entity:north-america-id',
        organizationId
      }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.equal({ actions: ['FOO:scenario:filter'] })

        done()
      })
    })
  })

  lab.test('check list multiple actions', (done) => {
    udaru.users.replacePolicies({
      id: adminId,
      organizationId,
      policies: [ savedPolicies[4].id, savedPolicies[5].id ]
    }, (err, res) => {
      if (err) return done(err)

      authorize.listActions({
        userId: adminId,
        resource: 'FOO:orga:shell:scenario:TEST',
        organizationId
      }, (err, res) => {
        expect(err).to.not.exist()
        expect(res.actions).to.contain([
          'FOO:scenario:granular-read',
          'FOO:scenario:clone',
          'FOO:scenario:download',
          'FOO:scenario:delete',
          'FOO:scenario:publish'
        ])

        done()
      })
    })
  })

  lab.after((done) => {
    udaru.organizations.delete('nearForm', done)
  })
})
