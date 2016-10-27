'use strict'
/* eslint-disable handle-callback-err */
const iam = require('iam-js')
const policyOps = require('./policyOps')

/*
* Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
*/
function isUserAuthorized (pool, { resource, action, userId }, cb) {
  policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
    if (err) {
      return cb(err)
    }

    iam(policies, ({ process }) => {
      process(resource, action, (err, access) => {
        if (err) return cb(err)

        cb(null, { access })
      })
    })
  })
}

//
// TODO: Note: this needs to take 'Deny' into account and also deal with wildcards.
// as would be worth looking into the pbac module code for reuse opportunity
//
function listAuthorizations (pool, {userId, resource}, cb) {
  const data = {}

  policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
    policies.forEach(p => {
      p.Statement.forEach(s => {
        s.Action.forEach(a => {
          if (s.Resource.indexOf(resource) > -1) {
            if (!data[a] || data[a] === 'Allow') {
              data[a] = s.Effect
            }
          }
        })
      })
    })
    cb(null, {actions: Object.getOwnPropertyNames(data)})
  })
}

module.exports = {
  isUserAuthorized: isUserAuthorized,
  listAuthorizations: listAuthorizations
}
