'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const _ = require('lodash')

const authorize = require('../../../src/lib/ops/authorizeOps')
const organizationOps = require('../../../src/lib/ops/organizationOps')
const userOps = require('../../../src/lib/ops/userOps')
const teamOps = require('../../../src/lib/ops/teamOps')
const policyOps = require('../../../src/lib/ops/policyOps')
const testUtils = require('../../utils')

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
    teamOps.listOrgTeams({organizationId}, (err, teams) => {
      if (err) return done(err)

      let managersTeam = _.find(teams, {name: 'Managers'})
      managersTeamId = managersTeam.id

      policyOps.listByOrganization({organizationId}, (err, policies) => {
        if (err) return done(err)

        wonkaPolicies = policies

        userOps.createUser(testUserData, (err, result) => {
          if (err) return done(err)
          testUserId = result.id
          updateUserData.id = testUserId

          teamOps.addUsersToTeam({ id: managersTeamId, users: [testUserId], organizationId }, (err, result) => {
            if (err) return done(err)

            userOps.replaceUserPolicies({ id: testUserId, policies: [_.find(wonkaPolicies, {name: 'Director'}).id], organizationId }, done)
          })
        })
      })
    })
  })

  lab.after((done) => {
    userOps.deleteUser({ id: testUserId, organizationId: 'WONKA' }, (err, res) => {
      if (err) return done(err)

      teamOps.deleteTeam({ id: testTeamId, organizationId }, done)
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId5'], organizationId }, (err, result) => {
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId7'], organizationId }, (err, result) => {
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId8'], organizationId }, (err, result) => {
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
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
    userOps.replaceUserPolicies({ id: testUserId, policies: ['policyId6'], organizationId }, (err, result) => {
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
      userOps.deleteUserPolicies({ id: testUserId, organizationId }, cb)
    })

    tasks.push((result, cb) => {
      teamOps.listOrgTeams({ organizationId }, (err, result) => {
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
      teamOps.createTeam(teamData, (err, result) => {
        expect(err).to.not.exist()
        testTeamId = result.id
        cb(err, result)
      })
    })

    // test for no permissions on the resource
    tasks.push((result, cb) => {
      authorize.listAuthorizations({
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
      teamOps.replaceUsersInTeam(teamData, cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        // expect(result.actions).to.equal(['finance:ReadBalanceSheet'])

        // NOTE: this test is not doing what is expcted
        // as a matter of fact, it was passing due to a bug in
        // policyOps.listAllUserPolicies
        // it should be reviewed thoroughly

        expect(result.actions).to.equal([])

        cb(err, result)
      })
    })

    // test for user permissions on the resource
    tasks.push((result, cb) => {
      testUtils.deleteUserFromAllTeams(testUserId, cb)
    })
    tasks.push((result, cb) => {
      userOps.replaceUserPolicies({
        id: testUserId,
        policies: [_.find(wonkaPolicies, {name: 'Sys admin'}).id],
        organizationId
      }, cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
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
      teamOps.addUsersToTeam({ id: '1', users: [testUserId], organizationId }, cb)
    })
    tasks.push((result, cb) => {
      userOps.replaceUserPolicies({
        id: testUserId,
        policies: [_.find(wonkaPolicies, {name: 'Finance Director'}).id],
        organizationId
      }, cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
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
    const policies = JSON.parse(fs.readFileSync(path.join(__dirname, 'policies.json'), { encoding: 'utf8' }))

    organizationOps.create({ id: organizationId, name: 'nearForm', description: 'nearform description', user: { name: 'admin' } }, (err, res) => {
      if (err) return done(err)

      adminId = res.user.id

      const tasks = policies.map((policy, index) => {
        return (next) => {
          policy.organizationId = organizationId
          policyOps.createPolicy(policy, next)
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
    userOps.replaceUserPolicies({ id: adminId, organizationId, policies: [ savedPolicies[0].id ] }, (err, res) => {
      if (err) return done(err)

      authorize.listAuthorizations({
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
    userOps.replaceUserPolicies({
      id: adminId,
      organizationId,
      policies: [ savedPolicies[0].id, savedPolicies[1].id ]
    }, (err, res) => {
      if (err) return done(err)

      authorize.listAuthorizations({
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
    userOps.replaceUserPolicies({
      id: adminId,
      organizationId,
      policies: [ savedPolicies[4].id, savedPolicies[5].id ]
    }, (err, res) => {
      if (err) return done(err)

      authorize.listAuthorizations({
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
    organizationOps.deleteById('nearForm', done)
  })
})
