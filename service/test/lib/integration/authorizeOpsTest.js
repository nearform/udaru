'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const logger = require('pino')()

const dbConn = require('../../../lib/dbConn')
const Authorize = require('../../../lib/authorizeOps')
const UserOps = require('../../../lib/userOps')
const PolicyOps = require('../../../lib/policyOps')
const TeamOps = require('../../../lib/teamOps')

const db = dbConn.create(logger)
const userOps = UserOps(db.pool, logger)
const policyOps = PolicyOps(db.pool)
const authorize = Authorize(userOps, policyOps)
const teamOps = TeamOps(db.pool, logger)


const testUserData = {
  name: 'Salman',
  organizationId: 'WONKA'
}

lab.experiment('AuthorizeOps', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) return next(err)
        testUserId = result.id

        next(err)
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 1 }]], (err, result) => {
        if (err) return next(err)

        next(err)
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet' }, (err, result) => {
        if (err) return next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        next(err)
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()

        next(err)
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards both in action and resource', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) return next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 5 }]], (err, result) => {
        if (err) return next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:dropTable' }, (err, result) => {
        if (err) return next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards only for resource', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 6 }]], (err, result) => {
        if (err) next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Read' }, (err, result) => {
        if (err) next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards only for action', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 7 }]], (err, result) => {
        if (err) next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Delete' }, (err, result) => {
        if (err) next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - check on a resource and action with wildcards for URL resource', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 8 }]], (err, result) => {
        if (err) next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: '/my/site/i/should/read/this', action: 'Read' }, (err, result) => {
        if (err) next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.true()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - should return false if the policies has a wildcard on the resource but we are asking for the wrong action', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 6 }]], (err, result) => {
        if (err) next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:balancesheet', action: 'database:Write' }, (err, result) => {
        if (err) next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.false()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize isUserAuthorized - should return false if the policies has a wildcard on the action but we are asking for the wrong resource', (done) => {
    const tasks = []
    let testUserId

    tasks.push((next) => {
      userOps.createUser(testUserData, (err, result) => {
        if (err) next(err)
        testUserId = result.id

        next()
      })
    })

    tasks.push((next) => {
      userOps.updateUser([testUserId, 'Salman', [{ id: 4 }], [{ id: 6 }]], (err, result) => {
        if (err) next(err)
        next()
      })
    })

    tasks.push((next) => {
      authorize.isUserAuthorized({ userId: testUserId, resource: 'database:pg01:notMyTable', action: 'database:Write' }, (err, result) => {
        if (err) next(err)

        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.access).to.be.false()

        next()
      })
    })

    tasks.push((next) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        next()
      })
    })

    async.series(tasks, done)
  })

  lab.test('authorize listAuthorizations - get all user actions on a resource', (done) => {
    let testUserId
    let testTeamId
    const testUserName = 'Orson Cart'
    const testTeamName = 'Actors'
    const testTeamParent = null
    const testTeamDesc = 'Famous Actors'
    const testOrgId = 'WONKA'
    const tasks = []

    // set-up
    tasks.push((cb) => {
      userOps.listAllUsers({}, (err, result) => {
        expect(result.length).to.equal(6)
        cb(err, result)
      })
    })

    tasks.push((res, cb) => {
      const userData = {
        name: testUserName,
        organizationId: testOrgId
      }
      userOps.createUser(userData, (err, result) => {
        testUserId = result.id
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      teamOps.listAllTeams([], (err, result) => {
        expect(result.length).to.equal(6)
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      const teamData = {
        name: testTeamName,
        description: testTeamDesc,
        parentId: testTeamParent,
        organizationId: testOrgId
      }
      teamOps.createTeam(teamData, (err, result) => {
        testTeamId = result.id
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      teamOps.listAllTeams([], (err, result) => {
        expect(result.length).to.equal(7)
        cb(err, result)
      })
    })

    // test for no permissions on the resource
    tasks.push((result, cb) => {
      authorize.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal([])

        cb(err, result)
      })
    })

    // test for team permissions on the resource
    tasks.push((result, cb) => {
      teamOps.updateTeam([testTeamId, testTeamName, testTeamDesc, [{ id: testUserId }], [{ id: 2 }]], cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet'])

        cb(err, result)
      })
    })

    // test for user permissions on the resource
    tasks.push((result, cb) => {
      userOps.updateUser([testUserId, testUserName, [], [{ id: 3 }]], cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet', 'finance:ImportBalanceSheet'])

        cb(err, result)
      })
    })

    // test for team and user permissions on the resource
    tasks.push((result, cb) => {
      userOps.updateUser([testUserId, testUserName, [{ id: 1 }], [{ id: 4 }]], cb)
    })

    tasks.push((result, cb) => {
      authorize.listAuthorizations({
        userId: testUserId,
        resource: 'database:pg01:balancesheet'
      }, (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result.actions).to.equal(['finance:ReadBalanceSheet', 'finance:EditBalanceSheet'])

        cb(err, result)
      })
    })

    // clean-up
    tasks.push((result, cb) => {
      userOps.deleteUserById(testUserId, (err, result) => {
        expect(err).to.not.exist()
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      teamOps.deleteTeamById([testTeamId], (err, result) => {
        expect(err).to.not.exist()
        cb(err, result)
      })
    })

    tasks.push((result, cb) => {
      policyOps.listByOrganization('WONKA', (err, policies) => {
        expect(err).to.not.exist()

        const defaultPolicy = policies.find((p) => {
          return p.name === 'Default Team Admin for ' + testTeamId
        })
        expect(defaultPolicy).to.exist()

        policyOps.deletePolicyById([defaultPolicy.id], done)
      })
    })

    async.waterfall(tasks, done)
  })
})
