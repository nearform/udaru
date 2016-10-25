'use strict'

const iam = require('iam-js')
const policyOps = require('./policyOps')

/*
* Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
*/
function isUserAuthorized (user, resource, action) {
// TODO: ACHECK
// user policies = policy.OpslistAllUserPolicies()
  // iam.process(resource, user policies, (err, result) => {
}

module.exports = {
  isUserAuthorized: isUserAuthorized
}
