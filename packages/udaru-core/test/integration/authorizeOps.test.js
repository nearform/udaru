'use strict'

const config = require('../../config')()
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const _ = require('lodash')
const db = require('../../lib/db')(null, config)
const SQL = require('@nearform/sql')

const udaru = require('../..')()
const authorize = udaru.authorize
const Factory = require('../factory')
const testUtils = require('../testUtils')

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

function deleteUserFromAllTeams (id, cb) {
  const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`
  db.query(sqlQuery, cb)
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

            udaru.users.replacePolicies({ id: testUserId, policies: [{id: _.find(wonkaPolicies, {name: 'Director'}).id}], organizationId }, done)
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId5'}], organizationId }, (err, result) => {
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId6'}], organizationId }, (err, result) => {
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId7'}], organizationId }, (err, result) => {
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId8'}], organizationId }, (err, result) => {
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId6'}], organizationId }, (err, result) => {
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
    udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'policyId6'}], organizationId }, (err, result) => {
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

  lab.test('authorize isUserAuthorized - using udaru:userId context variable applied to a user attached policy', (done) => {
    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:userId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - udaru:organizationId context variable applied to a user attached policy', (done) => {
    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:organizationId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + organizationId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - using udaru:userId context variable applied to a user attached policy', (done) => {
    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:userId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - using udaru:userId context variable applied to a TEAM attached policy', (done) => {
    const testPolicy = {
      id: 'teamContextPolicy',
      name: 'Team Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:userId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.teams.replacePolicies({ id: managersTeamId, policies: [{id: 'teamContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - using udaru:userId context variable applied to an ORG attached policy', (done) => {
    const testPolicy = {
      id: 'orgContextPolicy',
      name: 'Org Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:userId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.organizations.replacePolicies({ id: organizationId, policies: [{id: 'orgContextPolicy'}] }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - incorrect variable applied to a user attached policy', (done) => {
    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.AllowStatement(['read'], ['org:documents/$' + '{udaru:orgId}'])
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + organizationId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.false()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - test with udaru:organizationId variable for condition', (done) => {
    const Condition = { StringEquals: { 'udaru:organizationId': organizationId } }

    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['read'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - test with invalid variable for condition', (done) => {
    const Condition = { StringEquals: { 'udaru:organizationId': 'invalidOrg' } }

    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['read'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.false()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - test with udaru:organizationId variable for condition', (done) => {
    const Condition = { StringEquals: { 'udaru:organizationId': organizationId } }

    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['read'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - allow with udaru:source condition = api', (done) => {
    const Condition = { StringEquals: { 'request:source': 'api' } }

    const testPolicy = {
      id: 'userConditionPolicy',
      name: 'User Condition Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['write'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userConditionPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'write', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - deny test with udaru:source condition = server', (done) => {
    const Condition = { StringEquals: { 'request:source': 'server' } }

    const testPolicy = {
      id: 'userConditionPolicy',
      name: 'User Condition Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['write'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userConditionPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'write', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.false()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - test with date greater than condition', (done) => {
    const Condition = { DateGreaterThan: { 'request:currentTime': '2018-03-20T00:00:00Z' } }

    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['read'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.true()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })
  })

  lab.test('authorize isUserAuthorized - test with date less than condition', (done) => {
    const Condition = { DateLessThan: { 'request:currentTime': '2018-03-20T00:00:00Z' } }

    const testPolicy = {
      id: 'userContextPolicy',
      name: 'User Context Policy',
      version: '2012-10-17',
      organizationId: organizationId,
      statements: testUtils.StatementWithCondition('Allow', ['read'], ['org:documents/$' + '{udaru:userId}'], Condition)
    }

    udaru.policies.create(testPolicy, (err, result) => {
      if (err) return done(err)

      udaru.users.replacePolicies({ id: testUserId, policies: [{id: 'userContextPolicy'}], organizationId }, (err, result) => {
        if (err) return done(err)

        authorize.isUserAuthorized({ userId: testUserId, resource: 'org:documents/' + testUserId, action: 'read', organizationId }, (err, result) => {
          if (err) return done(err)

          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.access).to.be.false()

          udaru.policies.delete({id: testPolicy.id, organizationId}, (err, result) => {
            expect(err).to.not.exist()
            done()
          })
        })
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
      deleteUserFromAllTeams(testUserId, cb)
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

    // test for no permissions on the resource - callback
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

    // test for no permissions on the resource - promise, ip
    tasks.push((result, cb) => {
      authorize.listActions({
        userId: testUserId,
        resource: 'database:pg01:balancesheet',
        organizationId,
        sourceIpAddress: '127.0.0.1'
      }).then(result => {
        expect(result).to.exist()
        expect(result.actions).to.equal([])
        cb(null, result)
      }).catch(cb)
    })

    // test for no permissions on resource list - callback
    tasks.push((result, cb) => {
      authorize.listAuthorizationsOnResources({
        userId: testUserId,
        resources: ['database:pg01:balancesheet'],
        organizationId
      },
      (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.exist()
        expect(result[0].actions).to.equal([])
        cb(err, result)
      })
    })

    // test for no permissions on resource list - promise
    tasks.push((result, cb) => {
      authorize.listAuthorizationsOnResources({
        userId: testUserId,
        resources: ['database:pg01:balancesheet'],
        organizationId
      }).then(result => {
        expect(result).to.exist()
        expect(result[0].actions).to.equal([])
        cb(null, result)
      }).catch(cb)
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
      deleteUserFromAllTeams(testUserId, cb)
    })
    tasks.push((result, cb) => {
      udaru.users.replacePolicies({
        id: testUserId,
        policies: [{id: _.find(wonkaPolicies, {name: 'Sys admin'}).id}],
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
        policies: [{id: _.find(wonkaPolicies, {name: 'Finance Director'}).id}],
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
        expect(result.actions).to.have.length(2)
        expect(result.actions).to.only.include(['finance:ReadBalanceSheet', 'finance:EditBalanceSheet'])

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

  lab.test('batch check resource actions', (done) => {
    udaru.users.replacePolicies({ id: adminId, organizationId, policies: [{id: savedPolicies[0].id}, {id: savedPolicies[1].id}] }, (err, res) => {
      if (err) return done(err)

      const resourceBatch = [
        {
          resource: 'FOO:orga:CLOUDCUCKOO:scenario:bau-1',
          action: 'FOO:scenario:read'
        },
        {
          resource: 'FOO:orga:CLOUDCUCKOO:scenario:*:entity:usa-id',
          action: 'FOO:scenario:filter'
        },
        {
          resource: 'invalid_resource',
          action: 'invalid_action'
        }
      ]

      const access = [
        {
          resource: 'FOO:orga:CLOUDCUCKOO:scenario:bau-1',
          action: 'FOO:scenario:read',
          access: true
        },
        {
          resource: 'FOO:orga:CLOUDCUCKOO:scenario:*:entity:usa-id',
          action: 'FOO:scenario:filter',
          access: true
        },
        {
          resource: 'invalid_resource',
          action: 'invalid_action',
          access: false
        }
      ]

      authorize.batchAuthorization({
        userId: adminId,
        resourceBatch: resourceBatch,
        organizationId
      }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.equal(access)

        done()
      })
    })
  })

  lab.test('batch check resource actions empty', (done) => {
    udaru.users.replacePolicies({ id: adminId, organizationId, policies: [{id: savedPolicies[0].id}, {id: savedPolicies[1].id}] }, (err, res) => {
      if (err) return done(err)
      authorize.batchAuthorization({
        userId: adminId,
        resourceBatch: [],
        organizationId
      }).then(result => {
        done(Error('ERROR'))
      }).catch(err => {
        expect(err).to.exist()
        done()
      })
    })
  })

  lab.test('batch check resource actions invalid', (done) => {
    udaru.users.replacePolicies({ id: adminId, organizationId, policies: [{id: savedPolicies[0].id}, {id: savedPolicies[1].id}] }, (err, res) => {
      if (err) return done(err)
      authorize.batchAuthorization({
        userId: adminId,
        resourceBatch: [{resource: '', action: ''}],
        organizationId
      }, (err, res) => {
        expect(err).to.exist()

        done()
      })
    })
  })

  lab.test('check list simple action', (done) => {
    udaru.users.replacePolicies({ id: adminId, organizationId, policies: [{id: savedPolicies[0].id}] }, (err, res) => {
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
      policies: [ {id: savedPolicies[0].id}, {id: savedPolicies[1].id} ]
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
      policies: [ {id: savedPolicies[4].id}, {id: savedPolicies[5].id} ]
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
        policies: [{id: 'organizationPolicy'}],
        description: 'org description'
      }
    },
    teams: {
      userTeam: {
        name: 'user team',
        description: 'user team',
        organizationId: orgId,
        users: ['called'],
        policies: [{id: 'teamPolicy'}],
        parent: 'parentTeam'
      },
      parentTeam: {
        name: 'parent team',
        description: 'parent team',
        organizationId: orgId,
        policies: [{id: 'parentPolicy'}]
      }
    },
    users: {
      called: {
        id: userId,
        name: 'called',
        description: 'called',
        organizationId: orgId,
        policies: [{id: 'userPolicy'}]
      }
    },
    policies: {
      userPolicy: {
        id: 'userPolicy',
        name: 'userPolicy',
        organizationId: orgId,
        statements: Statements('action:user:read', 'resource:user')
      },
      teamPolicy: {
        id: 'teamPolicy',
        name: 'teamPolicy',
        organizationId: orgId,
        statements: Statements('action:team:read', 'resource:team')
      },
      organizationPolicy: {
        id: 'organizationPolicy',
        name: 'organizationPolicy',
        organizationId: orgId,
        statements: Statements('action:organization:read', 'resource:organization')
      },
      parentPolicy: {
        id: 'parentPolicy',
        name: 'parentPolicy',
        organizationId: orgId,
        statements: Statements('action:parent:team:read', 'resource:parent:team')
      }
    }
  }, udaru)

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
        authorize.isUserAuthorized(authorizationData).then(result => {
          expect(result).to.exist()
          expect(result.access).to.equal(expectedResult)
          next(null, result)
        }).catch(err => {
          next(err)
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
