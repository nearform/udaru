'use strict'

const originalIam = require('iam-js')

module.exports = (policies, cb1) => {
  if (policies.policyMock) {
    return cb1({process: (resource, action, cb2) => {
      cb2(new Error('policyMock test error'))
    }})
  }
  return originalIam(policies, cb1)
}
