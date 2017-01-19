const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const async = require('async')
const _ = require('lodash')

const utils = require('../../utils')
const userOps = require('../../../src/lib/ops/userOps')
const policyOps = require('../../../src/lib/ops/policyOps')
const teamOps = require('../../../src/lib/ops/teamOps')
const server = require('./../../../src/wiring-hapi')


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

function Factory (lab, data) {

  const records = {}

  function createUsers (done) {
    async.mapValues(data.users, (user, key, next) => {
      userOps.createUser(_.pick(user, 'id', 'name', 'organizationId'), next)
    }, (err, users) => {
      if (err) return done(err)

      Object.assign(records, users)
      done()
    })
  }

  function createPolicies (done) {
    async.mapValues(data.policies, (policy, key, next) => {
      policyOps.createPolicy(_.pick(policy, 'id', 'name', 'version', 'statements', 'organizationId'), next)
    }, (err, policies) => {
      if (err) return done(err)

      Object.assign(records, policies)
      done()
    })
  }

  function createTeams (done) {
    async.mapValues(data.teams, (team, key, next) => {
      teamOps.createTeam(_.pick(team, 'id', 'name', 'description', 'organizationId'), next)
    }, (err, teams) => {
      if (err) return done(err)

      Object.assign(records, teams)
      done()
    })
  }

  function linkTeamUsers (done) {
    const list = {}

    _.each(data.teams, (team, teamKey) => {
      if (!team.users || !team.users.length) return
      const teamId = records[teamKey].id
      list[teamId] = {
        id: teamId,
        organizationId: team.organizationId,
        users: []
      }

      _.each(team.users, (userKey) => {
        const userId = records[userKey].id
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
      const userId = records[userKey].id
      list[userId] = {
        id: userId,
        organizationId: user.organizationId,
        policies: []
      }

      _.each(user.policies, (policyKey) => {
        const policyId = records[policyKey].id
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
        id: records[key].id
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
        id: records[key].id
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
        id: records[key].id
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

  return records
}

function BuildFor (lab, records) {
  return new TestBuilder(lab, records)
}

class TestBuilder {

  constructor (lab, records) {
    this.lab = lab
    this.records = records
  }

  endpoint (endpointData) {
    this.endpointData = endpointData
    return this
  }

  server (serverInstance) {
    this.serverInstance = serverInstance
    return this
  }

  test (description) {
    const test = new CustomTest(this)
    test.test(description)
    return test
  }

}

function getValueFromPath (data, key) {
  const keys = key.split('.')
  const localKey = keys.shift()
  const localValue = data[localKey]

  if (keys.length === 0) {
    return localValue
  }

  if (_.isUndefined(localValue) || _.isNull(localValue)) {
    return undefined
  }

  return getValueFromPath(localValue, keys.join('.'))
}

function interpolate (value, data) {
  function interpolator (value) {
    return interpolate(value, data)
  }

  if (_.isArray(value)) {
    return _.map(value, interpolator)
  }

  if (_.isObject(value)) {
    return _.mapValues(value, interpolator)
  }

  if (!_.isString(value)) {
    return value
  }

  return value.replace(/\{\{(.+?)\}\}/, (match, key) => {
    return getValueFromPath(data, key) || match
  })
}

class CustomTest {
  constructor (builder) {
    this.builder = builder
  }

  test (description) {
    this.description = description
    return this
  }

  withPolicy (statement) {
    this.statement = statement
    return this
  }

  endpoint (endpointData) {
    this.endpointData = endpointData
    return this
  }

  shouldRespond (statusCode) {
    this.statusCode = statusCode
    this.build()
    return this
  }

  skip () {
    this._skip = true
    return this
  }

  build () {
    let test = lab.test
    if (this._skip) {
      test = lab.test.skip
    }

    test(this.description, (done) => {
      const { records, serverInstance, endpointData: parentEndpointData } = this.builder
      const { statusCode, endpointData: childEndpointData, statement } = this
      const endpointData = childEndpointData || parentEndpointData

      const policyData = Policy(interpolate(statement, records))
      policyData.id = records.testedPolicy.id

      policyOps.updatePolicy(policyData, (err, policy) => {
        if (err) return done(err)

        const options = utils.requestOptions(interpolate(endpointData, records))

        serverInstance.inject(options, (response) => {
          expect(response.statusCode).to.equal(statusCode)
          done()
        })
      })
    })
  }
}

lab.experiment('Routes Authorizations', () => {
  lab.experiment('users', () => {
    lab.experiment('GET /users/:id', () => {

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/users/{{called.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .skip()
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('GET /users', () => {

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'GET',
          url: '/authorization/users',
          headers: { authorization: '{{caller.id}}' }
        })


      endpoint.test('should authorize caller with policy to list users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with authorization on a single team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:list'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST', () => {

      const calledId = 'fake-user'
      const userData = {
        id: calledId,
        name: 'Fake User'
      }

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users',
          payload: userData,
          headers: { authorization: '{{caller.id}}' }
        })


      lab.afterEach((done) => {
        userOps.deleteUser({ id: calledId, organizationId }, () => {
          // this is needed to ignore the error (i.e. in case the user wasn't properly created)
          done()
        })
      })

      endpoint.test('should authorize caller with policy create users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(201)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['dummy']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller with authorization on a team (create user on team doesn\'t make sense)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:create'],
          Resource: ['/authorization/user/WONKA/team/*']
        }])
        .shouldRespond(403)

    })

    lab.experiment('DELETE', () => {

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:delete'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)

    })

    lab.experiment('PUT', () => {

      const userData = {
        name: 'called user'
      }

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/users/{{called.id}}',
          payload: userData,
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:update'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)

    })

    lab.experiment('PUT user policies', () => {

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'PUT',
          url: '/authorization/users/{{called.id}}/policies',
          payload: { policies: ['policy-to-add'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:add'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('POST user policies', () => {

      const records = Factory(lab, {
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'POST',
          url: '/authorization/users/{{called.id}}/policies',
          payload: { policies: ['policy-to-add'] },
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(200)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:replace'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE user policies', () => {

      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId, policies: ['policyToDelete'] }
        },
        policies: {
          testedPolicy: Policy(),
          policyToDelete: {
            id: 'policy-to-delete',
            version: '2016-07-01',
            name: 'Policy To Delete',
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}/policies',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)
    })

    lab.experiment('DELETE single user policy', () => {

      const records = Factory(lab, {
        teams: {
          calledTeam: { name: 'called team', organizationId, users: ['called'] }
        },
        users: {
          caller: { name: 'caller', organizationId, policies: ['testedPolicy'] },
          called: { name: 'called', organizationId, policies: ['policyToDelete'] }
        },
        policies: {
          testedPolicy: Policy(),
          policyToDelete: {
            id: 'policy-to-delete',
            version: '2016-07-01',
            name: 'Policy To Delete',
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

      const endpoint = BuildFor(lab, records)
        .server(server)
        .endpoint({
          method: 'DELETE',
          url: '/authorization/users/{{called.id}}/policies/policy-to-add',
          headers: { authorization: '{{caller.id}}' }
        })

      endpoint.test('should authorize caller with policy for specific users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/{{called.id}}']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users in specific team')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/{{calledTeam.id}}/*']
        }])
        .skip()
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all users')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should authorize caller with policy for all user actions')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:*'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(204)

      endpoint.test('should not authorize caller without a correct policy (action)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*']
        }])
        .shouldRespond(403)

      endpoint.test('should not authorize caller without a correct policy (resource)')
        .withPolicy([{
          Effect: 'Allow',
          Action: ['authorization:users:policy:remove'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])
        .shouldRespond(403)

    })

  })
})
