'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const _ = require('lodash')

const testUtils = require('../utils')
const { udaru } = testUtils
const authorize = udaru.authorize
const Factory = require('../factory')

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

lab.experiment('AuthorizeOps - test inherited policies', () => {
  const orgId = 'orgId'
  const userId = 'userId'
  function Statements (action, resource) {
    return {
      Statement: [{
        Effect: 'Allow',
        Action: [action],
        Resource: [resource]
      }]
    }
  }

  Factory(lab, {
    organizations: {
      org: {
        id: orgId,
        name: 'org name',
        policies: ['organizationPolicy'],
        description: 'org description'
      }
    },
    teams: {
      userTeam: {
        name: 'user team',
        description: 'user team',
        organizationId: orgId,
        users: ['called'],
        policies: ['teamPolicy'],
        parent: 'parentTeam'
      },
      parentTeam: {
        name: 'parent team',
        description: 'parent team',
        organizationId: orgId,
        policies: ['parentPolicy']
      }
    },
    users: {
      called: {
        id: userId,
        name: 'called',
        description: 'called',
        organizationId: orgId,
        policies: ['userPolicy']
      }
    },
    policies: {
      userPolicy: {
        name: 'userPolicy',
        organizationId: orgId,
        statements: Statements('action:user:read', 'resource:user')
      },
      teamPolicy: {
        name: 'teamPolicy',
        organizationId: orgId,
        statements: Statements('action:team:read', 'resource:team')
      },
      organizationPolicy: {
        name: 'organizationPolicy',
        organizationId: orgId,
        statements: Statements('action:organization:read', 'resource:organization')
      },
      parentPolicy: {
        name: 'parentPolicy',
        organizationId: orgId,
        statements: Statements('action:parent:team:read', 'resource:parent:team')
      }
    }
  })

  lab.test('user has its own and inherited authorizations', (done) => {
    const tasks = []

    function check (action, resource, expectedResult, next) {
      function checkAuthorization (action, resource, expectedResult, next) {
        const authorizationData = {
          userId: userId,
          organizationId: orgId,
          action: action,
          resource: resource
        }
        authorize.isUserAuthorized(authorizationData, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.equal(expectedResult)

          next(err, result)
        })
      }

      return function (next) {
        checkAuthorization(action, resource, expectedResult, next)
      }
    }

    tasks.push(check('action:user:read', 'resource:user', true))
    tasks.push(check('action:team:read', 'resource:team', true))
    tasks.push(check('action:team:write', 'resource:team', false))
    tasks.push(check('action:parent:team:read', 'resource:parent:team', true))
    tasks.push(check('action:parent:team:write', 'resource:parent:team', false))
    tasks.push(check('action:organization:read', 'resource:organization', true))
    tasks.push(check('action:organization:write', 'resource:organization', false))

    tasks.push(check('action:user:read', 'resource:team', false))
    tasks.push(check('action:user:read', 'resource:parent:team', false))
    tasks.push(check('action:user:read', 'resource:organzation', false))

    async.series(tasks, done)
  })
})
