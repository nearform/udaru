'use strict'

const async = require('async')
const _ = require('lodash')

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

function asyncify () {
  let promiseResolve = null
  let promiseReject = null

  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve
    promiseReject = reject
  })

  const cb = function (err, ...args) {
    if (err) return promiseReject(err)

    return promiseResolve(args[0])
  }

  return [promise, cb]
}

function Factory (lab, data, udaru) {
  const records = {}

  function createUsers (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.users) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.mapValues(data.users, (user, key, next) => {
      udaru.users.create(_.pick(user, 'id', 'name', 'organizationId'), next)
    }, (err, users) => {
      if (err) return done(err)

      Object.assign(records, users)
      done()
    })

    return promise
  }

  function createPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.policies) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

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

    return promise
  }

  function createSharedPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.sharedPolicies) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

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

    return promise
  }

  function createTeams (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.teams) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.mapValues(data.teams, (team, key, next) => {
      udaru.teams.create(_.pick(team, 'id', 'name', 'description', 'organizationId'), next)
    }, (err, teams) => {
      if (err) return done(err)

      Object.assign(records, teams)
      done()
    })

    return promise
  }

  function createOrganizations (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.organizations) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

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

    return promise
  }

  function linkTeamUsers (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

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

    return promise
  }

  function linkTeamPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

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

    return promise
  }

  function linkOrganizationPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    const list = {}

    _.each(data.organizations, (organization, orgKey) => {
      if (!organization.policies || !organization.policies.length) return
      const orgId = records[orgKey].id
      list[orgId] = {
        id: orgId,
        policies: []
      }

      _.each(organization.policies, (policy) => {
        const policyKey = policy.key || policy
        const policyId = records[policyKey].id
        list[orgId].policies.push({
          id: policyId,
          variables: policy.variables || {}
        })
      })
    })

    async.each(list, (org, next) => {
      org.policies = _.uniq(org.policies)
      udaru.organizations.replacePolicies({ id: org.id, policies: org.policies }, next)
    }, done)

    return promise
  }

  function buildTeamTree (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    async.eachOf(data.teams, (team, teamKey, next) => {
      if (!team.parent) return next()

      const teamId = records[teamKey].id
      const parentId = records[team.parent].id

      udaru.teams.move({ id: teamId, parentId, organizationId: team.organizationId }, next)
    }, done)

    return promise
  }

  function linkUserPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

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

    return promise
  }

  function createData (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

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

    return promise
  }

  function deleteUsers (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.users) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.eachOf(data.users, (user, key, next) => {
      udaru.users.delete({
        organizationId: user.organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)

    return promise
  }

  function deleteTeams (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.teams) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.eachOf(data.teams, (team, key, next) => {
      udaru.teams.delete({
        organizationId: team.organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)

    return promise
  }

  function deletePolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.policies) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.eachOf(data.policies, (policy, key, next) => {
      udaru.policies.delete({
        organizationId: records[key].organizationId,
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)

    return promise
  }

  function deleteSharedPolicies (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.sharedPolicies) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.eachOf(data.sharedPolicies, (policy, key, next) => {
      udaru.policies.deleteShared({
        id: records[key].id
      }, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)

    return promise
  }

  function deleteOrganizations (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.organizations) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.eachOf(data.organizations, (org, key, next) => {
      udaru.organizations.delete(records[key].id, (err) => {
        if (err && err.output.payload.error !== 'Not Found') return next(err)
        next()
      })
    }, done)

    return promise
  }

  function deleteData (done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    if (!data.users) {
      if (promise) {
        return Promise.resolve()
      } else {
        return done()
      }
    }

    async.series([
      deleteUsers,
      deleteTeams,
      deletePolicies,
      deleteSharedPolicies,
      deleteOrganizations
    ], done)

    return promise
  }

  lab.beforeEach(createData)
  lab.afterEach(deleteData)

  return records
}

module.exports = Factory
