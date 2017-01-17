const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const async = require('async')
const _ = require('lodash')

const utils = require('../../utils')
const userOps = require('../../../lib/ops/userOps')
const policyOps = require('../../../lib/ops/policyOps')
const teamOps = require('../../../lib/ops/teamOps')
const server = require('./../../../wiring-hapi')

function prepareTest (lab, data) {

  const prepared = {
    res: {}
  }

  function createUsers (done) {
    async.mapValues(data.users, (user, key, next) => {
      userOps.createUser(_.pick(user, 'id', 'name', 'organizationId'), next)
    }, (err, users) => {
      if (err) return done(err)

      Object.assign(prepared.res, users)
      done()
    })
  }

  function createPolicies (done) {
    async.mapValues(data.policies, (policy, key, next) => {
      policyOps.createPolicy(_.pick(policy, 'id', 'name', 'version', 'statements', 'organizationId'), next)
    }, (err, policies) => {
      if (err) return done(err)

      Object.assign(prepared.res, policies)
      done()
    })
  }

  function createTeams (done) {
    async.mapValues(data.teams, (team, key, next) => {
      teamOps.createTeam(_.pick(team, 'id', 'name', 'description', 'organizationId'), next)
    }, (err, teams) => {
      if (err) return done(err)

      Object.assign(prepared.res, teams)
      done()
    })
  }

  function linkTeamUsers (done) {
    const list = {}

    _.each(data.teams, (team, teamKey) => {
      if (!team.users || !team.users.length) return
      const teamId = prepared.res[teamKey].id
      list[teamId] = {
        id: teamId,
        organizationId: team.organizationId,
        users: []
      }

      _.each(team.users, (userKey) => {
        const userId = prepared.res[userKey].id
        list[teamId].users.push(userId)
      })
    })

    async.each(list, (team, next) => {
      team.users = _.uniq(team.users)
      teamOps.replaceUsersInTeam(team, next)
    }, done)
  }

  function linkTeamPolicies (done) {
    // TODO: implement
    done()
  }

  function linkUserPolicies (done) {
    const list = {}

    _.each(data.users, (user, userKey) => {
      if (!user.policies || !user.policies.length) return
      const userId = prepared.res[userKey].id
      list[userId] = {
        id: userId,
        organizationId: user.organizationId,
        policies: []
      }

      _.each(user.policies, (policyKey) => {
        const policyId = prepared.res[policyKey].id
        list[userId].policies.push(policyId)
      })
    })

    async.each(list, (user, next) => {
      user.policies = _.uniq(user.policies)
      userOps.replaceUserPolicies(user, next)
    }, done)
  }

  function createData (done) {
    async.parallel([
      createUsers,
      createPolicies,
      createTeams
    ], (err) => {
      if (err) return done(err)

      async.parallel([
        linkTeamUsers,
        linkTeamPolicies,
        linkUserPolicies
      ], done)
    })
  }

  function deleteUsers (done) {
    async.eachOf(data.users, (user, key, next) => {
      userOps.deleteUser({
        organizationId: user.organizationId,
        id: prepared.res[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteTeams (done) {
    async.eachOf(data.teams, (team, key, next) => {
      teamOps.deleteTeam({
        organizationId: team.organizationId,
        id: prepared.res[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deletePolicies (done) {
    async.eachOf(data.policies, (policy, key, next) => {
      policyOps.deletePolicy({
        organizationId: policy.organizationId,
        id: prepared.res[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteData (done) {
    async.parallel([
      deleteUsers,
      deleteTeams,
      deletePolicies
    ], done)
  }

  lab.beforeEach(createData)
  lab.afterEach(deleteData)

  return prepared
}

lab.experiment('Routes Authorizations', () => {
  lab.experiment('users', () => {
    lab.experiment('GET /users/:id', () => {

      const organizationId = 'WONKA'

      function Policy (Statement) {
        return {
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.test('should authorize caller with policy for specific users', (done) => {
        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: [`/authorization/user/WONKA/*/${test.res.called.id}`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: [`/authorization/user/WONKA/${test.res.calledTeam.id}/*`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('GET /users', () => {

      const organizationId = 'WONKA'

      function Policy (Statement) {
        return {
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.test('should authorize caller with policy to list users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller with authorization on a single team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('POST', () => {
      const organizationId = 'WONKA'
      const calledId = 'fake-user'
      const userData = {
        id: calledId,
        name: 'fake-user'
      }

      function Policy (Statement) {
        return {
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.afterEach((done) => {
        userOps.deleteUser({ id: calledId, organizationId }, () => {
          // this is needed to ignore the error (i.e. in case the user wasn't properly created)
          done()
        })
      })

      lab.test('should authorize caller with policy create users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(201)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller with authorization on a team (create user on team doesn\'t make sense)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('DELETE', () => {

      const organizationId = 'WONKA'

      function Policy (Statement) {
        return {
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: [`/authorization/user/WONKA/*/${test.res.called.id}`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: [`/authorization/user/WONKA/${test.res.calledTeam.id}/*`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${test.res.called.id}`,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('PUT', () => {

      const organizationId = 'WONKA'
      const userData = {
        name: 'called user',
        teams: []
      }

      function Policy (Statement) {
        return {
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy()
        }
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: [`/authorization/user/WONKA/*/${test.res.called.id}`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: [`/authorization/user/WONKA/${test.res.calledTeam.id}/*`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}`,
            payload: userData,
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('PUT user policies', () => {

      const organizationId = 'WONKA'

      function Policy (Statement) {
        return {
          id: null,
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      const test = prepareTest(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId }
        },
        policies: {
          testedPolicy: Policy(),
          policyToAdd: {
            id: 'policy-to-add',
            version: '2016-07-01',
            name: 'Policy To Add',
            statements: JSON.stringify({
              Statement: [{
                Effect: 'Allow',
                Action: ['an-action'],
                Resource: ['a-resource']
              }]
            }),
            organizationId
          }
        }
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: [`/authorization/user/WONKA/*/${test.res.called.id}`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: [`/authorization/user/WONKA/${test.res.calledTeam.id}/*`]
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        policyData.id = test.res.testedPolicy.id

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'PUT',
            url: `/authorization/users/${test.res.called.id}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: test.res.caller.id }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('POST user policies', () => {

      const organizationId = 'WONKA'
      const calledId = 'called-id'
      let callerId
      let calledTeamId
      let policyId

      function Policy (Statement) {
        return {
          id: policyId || null,
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }


      lab.before((done) => {
        userOps.createUser({ name: 'caller', organizationId }, (err, caller) => {
          if (err) return done(err)
          callerId = caller.id

          userOps.createUser({ id: calledId, name: 'called', organizationId }, (err, called) => {
            if (err) return done(err)

            teamOps.createTeam({ name: 'called team', organizationId }, (err, team) => {
              if (err) return done(err)
              calledTeamId = team.id

              teamOps.addUsersToTeam({ id: calledTeamId, users: [calledId], organizationId }, (err) => {
                if (err) return done(err)

                const policyCreateData = Policy()

                policyOps.createPolicy(policyCreateData, (err, policy) => {
                  if (err) return done(err)
                  policyId = policy.id

                  userOps.addUserPolicies({ id: callerId, organizationId, policies: [policyId] }, (err) => {
                    if (err) return done(err)

                    policyOps.createPolicy({
                      id: 'policy-to-add',
                      version: '2016-07-01',
                      name: 'Policy To Add',
                      statements: JSON.stringify({
                        Statement: [{
                          Effect: 'Allow',
                          Action: ['an-action'],
                          Resource: ['a-resource']
                        }]
                      }),
                      organizationId
                    }, done)
                  })
                })
              })
            })
          })
        })
      })

      lab.after((done) => {
        userOps.deleteUser({ id: callerId, organizationId }, (err) => {
          if (err) return done(err)
          userOps.deleteUser({ id: calledId, organizationId }, (err) => {
            if (err) return done(err)
            teamOps.deleteTeam({ id: calledTeamId, organizationId }, (err) => {
              if (err) return done(err)
              policyOps.deletePolicy({ id: policyId, organizationId }, (err) => {
                if (err) return done(err)
                policyOps.deletePolicy({ id: 'policy-to-add', organizationId }, done)
              })
            })
          })
        })
      })

      lab.afterEach((done) => {
        userOps.deleteUserPolicies({ id: calledId, organizationId }, done)
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: [`/authorization/user/WONKA/*/${calledId}`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: [`/authorization/user/WONKA/${calledTeamId}/*`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'POST',
            url: `/authorization/users/${calledId}/policies`,
            payload: { policies: ['policy-to-add'] },
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

    lab.experiment('DELETE user policies', () => {

      const organizationId = 'WONKA'
      const calledId = 'called-id'
      let callerId
      let calledTeamId
      let policyId

      function Policy (Statement) {
        return {
          id: policyId || null,
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }


      lab.before((done) => {
        userOps.createUser({ name: 'caller', organizationId }, (err, caller) => {
          if (err) return done(err)
          callerId = caller.id

          userOps.createUser({ id: calledId, name: 'called', organizationId }, (err, called) => {
            if (err) return done(err)

            teamOps.createTeam({ name: 'called team', organizationId }, (err, team) => {
              if (err) return done(err)
              calledTeamId = team.id

              teamOps.addUsersToTeam({ id: calledTeamId, users: [calledId], organizationId }, (err) => {
                if (err) return done(err)

                const policyCreateData = Policy()

                policyOps.createPolicy(policyCreateData, (err, policy) => {
                  if (err) return done(err)
                  policyId = policy.id

                  userOps.addUserPolicies({ id: callerId, organizationId, policies: [policyId] }, (err) => {
                    if (err) return done(err)

                    policyOps.createPolicy({
                      id: 'policy-to-delete',
                      version: '2016-07-01',
                      name: 'Policy To Add',
                      statements: JSON.stringify({
                        Statement: [{
                          Effect: 'Allow',
                          Action: ['an-action'],
                          Resource: ['a-resource']
                        }]
                      }),
                      organizationId
                    }, done)
                  })
                })
              })
            })
          })
        })
      })

      lab.after((done) => {
        userOps.deleteUser({ id: callerId, organizationId }, (err) => {
          if (err) return done(err)
          userOps.deleteUser({ id: calledId, organizationId }, (err) => {
            if (err) return done(err)
            teamOps.deleteTeam({ id: calledTeamId, organizationId }, (err) => {
              if (err) return done(err)
              policyOps.deletePolicy({ id: policyId, organizationId }, (err) => {
                if (err) return done(err)
                policyOps.deletePolicy({ id: 'policy-to-delete', organizationId }, done)
              })
            })
          })
        })
      })

      lab.beforeEach((done) => {
        userOps.replaceUserPolicies({ id: calledId, policies: ['policy-to-delete'], organizationId }, done)
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: [`/authorization/user/WONKA/*/${calledId}`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: [`/authorization/user/WONKA/${calledTeamId}/*`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })


    lab.experiment('DELETE single user policy', () => {

      const organizationId = 'WONKA'
      const calledId = 'called-id'
      let callerId
      let calledTeamId
      let policyId

      function Policy (Statement) {
        return {
          id: policyId || null,
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }


      lab.before((done) => {
        userOps.createUser({ name: 'caller', organizationId }, (err, caller) => {
          if (err) return done(err)
          callerId = caller.id

          userOps.createUser({ id: calledId, name: 'called', organizationId }, (err, called) => {
            if (err) return done(err)

            teamOps.createTeam({ name: 'called team', organizationId }, (err, team) => {
              if (err) return done(err)
              calledTeamId = team.id

              teamOps.addUsersToTeam({ id: calledTeamId, users: [calledId], organizationId }, (err) => {
                if (err) return done(err)

                const policyCreateData = Policy()

                policyOps.createPolicy(policyCreateData, (err, policy) => {
                  if (err) return done(err)
                  policyId = policy.id

                  userOps.addUserPolicies({ id: callerId, organizationId, policies: [policyId] }, (err) => {
                    if (err) return done(err)

                    policyOps.createPolicy({
                      id: 'policy-to-delete',
                      version: '2016-07-01',
                      name: 'Policy To Add',
                      statements: JSON.stringify({
                        Statement: [{
                          Effect: 'Allow',
                          Action: ['an-action'],
                          Resource: ['a-resource']
                        }]
                      }),
                      organizationId
                    }, done)
                  })
                })
              })
            })
          })
        })
      })

      lab.after((done) => {
        userOps.deleteUser({ id: callerId, organizationId }, (err) => {
          if (err) return done(err)
          userOps.deleteUser({ id: calledId, organizationId }, (err) => {
            if (err) return done(err)
            teamOps.deleteTeam({ id: calledTeamId, organizationId }, (err) => {
              if (err) return done(err)
              policyOps.deletePolicy({ id: policyId, organizationId }, (err) => {
                if (err) return done(err)
                policyOps.deletePolicy({ id: 'policy-to-delete', organizationId }, done)
              })
            })
          })
        })
      })

      lab.beforeEach((done) => {
        userOps.replaceUserPolicies({ id: calledId, policies: ['policy-to-delete'], organizationId }, done)
      })

      lab.test('should authorize caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: [`/authorization/user/WONKA/*/${calledId}`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test.skip('should authorize caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: [`/authorization/user/WONKA/${calledTeamId}/*`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should authorize caller with policy for all user actions', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (action)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })

      lab.test('should not authorize caller without a correct policy (resource)', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/${calledId}/policies/policy-to-add`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })

  })
})
