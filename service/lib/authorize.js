'use strict'

const iam = require('iam-js')
const policyOps = require('./policyOps')

/*
* Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
*/
function isUserAuthorized (pool, { resource, action, userId }, cb) {
  policyOps.listAllUserPolicies(pool, [userId], (err, policies) => {
    iam(policies, ({ process }) => {
      process(resource, action, (err, access) => {
        if (err) return cb(err)

        cb(null, { access })
      })
    })
  })
}

module.exports = {
  isUserAuthorized: isUserAuthorized
}
