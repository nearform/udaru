'use strict'
/* eslint-disable handle-callback-err */
const Boom = require('boom')
const iam = require('iam-js')

module.exports = function (policyOps) {
  return {
    /*
    * Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
    */
    isUserAuthorized: function isUserAuthorized ({ resource, action, userId }, cb) {
      policyOps.listAllUserPolicies({ userId }, (err, policies) => {
        if (err) {
          return cb(err)
        }

        iam(policies, ({ process }) => {
          process(resource, action, (err, access) => {
            if (err) {
              return cb(err)
            }

            cb(null, { access })
          })
        })
      })
    },

    //
    // TODO: Note: this needs to take 'Deny' into account and also deal with wildcards.
    // as would be worth looking into the pbac module code for reuse opportunity
    //
    listAuthorizations: function listAuthorizations ({ userId, resource }, cb) {
      const data = []
      var actions = []
      var errors = []
      // build the set of actions in the user's policy set
      // can't check per resource as requires wildcard processing

      policyOps.listAllUserPolicies({ userId }, (err, policies) => {
        if (err) return cb(Boom.wrap(err))

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
              if (err) return errors.push(err)
              if (access) {
                data.push(action)
              }
            })
          })
        })

        if (errors.length > 0) return cb(Boom.wrap(errors.shift()))
        // return thE allowable actions
        cb(null, {actions: data})
      })
    }
  }
}
