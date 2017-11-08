'use strict'

const async = require('async')
const _ = require('lodash')

const utils = require('./utils')

const DEFAULT_POLICY = {
  version: '2016-07-01',
  name: 'Test Policy',
  statements: {
    Statement: [{
      Effect: 'Allow',
      Action: ['dummy'],
      Resource: ['dummy']
    }]
  },
  organizationId: 'WONKA'
}

const DEFAULT_SHARED_POLICY = {
  version: '2016-07-01',
  name: 'Shared Policy',
  statements: {
    Statement: [{
      Effect: 'Allow',
      Action: ['dummy'],
      Resource: ['dummy']
    }]
  }
}

function Factory (lab, data, udaruCore) {
  const udaru = udaruCore || utils.udaru
  const records = {}

  function createUsers (done) {
    if (!data.users) return done()

    async.mapValues(data.users, (user, key, next) => {
      udaru.users.create(_.pick(user, 'id', 'name', 'organizationId'), next)
    }, (err, users) => {
      if (err) return done(err)

      Object.assign(records, users)
      done()
    })
  }

  function createPolicies (done) {
    if (!data.policies) return done()

    async.mapValues(data.policies, (policy, key, next) => {
      udaru.policies.create(Object.assign({}, DEFAULT_POLICY, _.pick(policy, 'id', 'name', 'version', 'statements', 'organizationId')), (err, res) => {
        if (err) return next(err)
        res.organizationId = policy.organizationId || DEFAULT_POLICY.organizationId
        next(null, res)
      })
    }, (err, policies) => {
      if (err) return done(err)

      Object.assign(records, policies)
      done()
    })
  }

  function createSharedPolicies (done) {
    if (!data.sharedPolicies) return done()

    async.mapValues(data.sharedPolicies, (policy, key, next) => {
      udaru.policies.createShared(Object.assign(
        {},
        DEFAULT_SHARED_POLICY,
        _.pick(policy, 'id', 'name', 'version', 'statements')
      ), next)
    }, (err, policies) => {
      if (err) return done(err)

      Object.assign(records, policies)
      done()
    })
  }

  function createTeams (done) {
    if (!data.teams) return done()

    async.mapValues(data.teams, (team, key, next) => {
      udaru.teams.create(_.pick(team, 'id', 'name', 'description', 'organizationId'), next)
    }, (err, teams) => {
      if (err) return done(err)

      Object.assign(records, teams)
      done()
    })
  }

  function createOrganizations (done) {
    if (!data.organizations) return done()

    async.mapValues(data.organizations, (org, key, next) => {
      udaru.organizations.create(_.pick(org, 'id', 'name', 'description'), (err, res) => {
        if (err) return next(err)
        next(null, res.organization)
      })
    }, (err, orgs) => {
      if (err) return done(err)

      Object.assign(records, orgs)
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
      udaru.teams.replaceUsers(team, next)
    }, done)
  }

  function linkTeamPolicies (done) {
    const list = {}

    _.each(data.teams, (team, teamKey) => {
      if (!team.policies || !team.policies.length) return
      const teamId = records[teamKey].id
      list[teamId] = {
        id: teamId,
        organizationId: team.organizationId,
        policies: []
      }

      _.each(team.policies, (policy) => {
        const policyKey = policy.key || policy
        const policyId = records[policyKey].id
        list[teamId].policies.push({
          id: policyId,
          variables: policy.variables || {}
        })
      })
    })

    async.each(list, (team, next) => {
      team.policies = _.uniq(team.policies)
      udaru.teams.replacePolicies(team, next)
    }, done)
  }

  function linkOrganizationPolicies (done) {
    const list = {}

    _.each(data.organizations, (organization, orgKey) => {
      if (!organization.policies || !organization.policies.length) return
      const orgId = records[orgKey].id
      list[orgId] = {
        id: orgId,
        policies: []
      }

      _.each(organization.policies, (policyKey) => {
        const policyId = records[policyKey].id
        list[orgId].policies.push(policyId)
      })
    })

    async.each(list, (org, next) => {
      org.policies = _.uniq(org.policies)
      udaru.organizations.replacePolicies({ id: org.id, policies: org.policies }, next)
    }, done)
  }

  function buildTeamTree (done) {
    async.eachOf(data.teams, (team, teamKey, next) => {
      if (!team.parent) return next()

      const teamId = records[teamKey].id
      const parentId = records[team.parent].id

      udaru.teams.move({ id: teamId, parentId, organizationId: team.organizationId }, next)
    }, done)
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

      _.each(user.policies, (policy) => {
        const policyKey = policy.key || policy
        const policyId = records[policyKey].id
        list[userId].policies.push({
          id: policyId,
          variables: policy.variables || {}
        })
      })
    })

    async.each(list, (user, next) => {
      user.policies = _.uniq(user.policies)
      udaru.users.replacePolicies(user, next)
    }, done)
  }

  function createData (done) {
    async.series([
      createOrganizations,
      createUsers,
      createPolicies,
      createSharedPolicies,
      createTeams
    ], (err) => {
      if (err) return done(err)

      async.parallel([
        linkTeamUsers,
        linkTeamPolicies,
        linkUserPolicies,
        linkOrganizationPolicies,
        buildTeamTree
      ], done)
    })
  }

  function deleteUsers (done) {
    if (!data.users) return done()

    async.eachOf(data.users, (user, key, next) => {
      udaru.users.delete({
        organizationId: user.organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteTeams (done) {
    if (!data.teams) return done()

    async.eachOf(data.teams, (team, key, next) => {
      udaru.teams.delete({
        organizationId: team.organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deletePolicies (done) {
    if (!data.policies) return done()

    async.eachOf(data.policies, (policy, key, next) => {
      udaru.policies.delete({
        organizationId: records[key].organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteSharedPolicies (done) {
    if (!data.sharedPolicies) return done()

    async.eachOf(data.sharedPolicies, (policy, key, next) => {
      udaru.policies.deleteShared({
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteOrganizations (done) {
    if (!data.organizations) return done()

    async.eachOf(data.organizations, (org, key, next) => {
      udaru.organizations.delete(records[key].id, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)
  }

  function deleteData (done) {
    async.series([
      deleteUsers,
      deleteTeams,
      deletePolicies,
      deleteSharedPolicies,
      deleteOrganizations
    ], done)
  }

  lab.beforeEach(createData)
  lab.afterEach(deleteData)

  return records
}

module.exports = Factory
