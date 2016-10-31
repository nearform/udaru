'use strict'
/* eslint-disable handle-callback-err */
const iam = require('iam-js')
const policyOps = require('./policyOps')
const userOps = require('./userOps')
const async = require('async')

/*
* Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
*/
function isUserAuthorized (rsc, { resource, action, userId }, cb) {
  async.waterfall([
    (next) => {
      userOps.getUserByToken(rsc, userId, (err, user) => {
        if (err) {
          return next(err)
        }

        next(null, user)
      })
    },
    (user, next) => {
      policyOps.listAllUserPolicies(rsc, { userId: user.id }, (err, policies) => {
        if (err) {
          return next(err)
        }

        iam(policies, ({ process }) => {
          process(resource, action, (err, access) => {
            if (err) {
              return next(err)
            }

            next(null, { access })
          })
        })
      })
    }
  ], (err, data) => {
    if (err) {
      return cb(err)
    }

    cb(null, data)
  })
}

//
// TODO: Note: this needs to take 'Deny' into account and also deal with wildcards.
// as would be worth looking into the pbac module code for reuse opportunity
//
function listAuthorizations (rsc, { userId, resource }, cb) {
  const data = {}

  policyOps.listAllUserPolicies(rsc, { userId }, (err, policies) => {
    if (err) return cb(rsc.mu.error.wrap(err))

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

    cb(null, { actions: Object.getOwnPropertyNames(data) })
  })
}

module.exports = {
  isUserAuthorized: isUserAuthorized,
  listAuthorizations: listAuthorizations
}
