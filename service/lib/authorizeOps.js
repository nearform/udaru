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
  const data = []
  var actions = []
  // build the set of actions in the user's policy set
  // can't check per resource as requires wildcard processing

  policyOps.listAllUserPolicies(rsc, { userId }, (err, policies) => {
    if (err) return cb(rsc.mu.error.wrap(err))

    policies.forEach(p => {
      p.Statement.forEach(s => {
        s.Action.forEach(a => {
          if (s.Resource.indexOf(resource) > -1) {
            actions.push(a)
          }
        })
      })
    })
    actions = Array.from(new Set(actions)) // dedupe
    // check each action aginst the resource for this user
    actions.forEach(action => {
      iam(policies, ({ process }) => {
        process(resource, action, (err, access) => {
          if (err) return cb(err)
          if (access) {
            data.push(action)
          }
        })
      })
    })
    // return thE allowable actions
    cb(null, {actions: data})
  })
}

module.exports = {
  isUserAuthorized: isUserAuthorized,
  listAuthorizations: listAuthorizations
}
