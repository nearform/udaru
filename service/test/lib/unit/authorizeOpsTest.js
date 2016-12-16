'use strict'
/* eslint-disable handle-callback-err */

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
var proxyquire = require('proxyquire')

var iamMock = require('../../mocks/iamMock')
const Authorize = proxyquire('../../../lib/authorizeOps', {'iam-js': iamMock})

lab.experiment('authorize', () => {

  lab.test('isUserAuthorized - should return an error if fetching the user policies returns and error', (done) => {
    var policyOps = {listAllUserPolicies: function (userId, cb) {
      return cb(new Error('test error'))
    }}

    var authorizeOps = Authorize(policyOps)
    authorizeOps.isUserAuthorized({
      userId: 1,
      resource: 'database:pg01:balancesheet',
      action: 'finance:ReadBalanceSheet'
    }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()
      expect(err.message).to.equal('test error')

      done()
    })
  })

  lab.test('isUserAuthorized - should return an error if iam-js returns an error', (done) => {
    var policyOps = {listAllUserPolicies: function (userId, cb) {
      return cb(null, {policyMock: true})
    }}

    var authorizeOps = Authorize(policyOps)
    authorizeOps.isUserAuthorized({
      userId: 1,
      resource: 'database:pg01:balancesheet',
      action: 'finance:ReadBalanceSheet'
    }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()
      expect(err.message).to.equal('policyMock test error')

      done()
    })
  })

  lab.test('listAuthorizations - should return an error if fetching the user policies returns and error', (done) => {
    var policyOps = {listAllUserPolicies: function (userId, cb) {
      return cb(new Error('test error'))
    }}

    var authorizeOps = Authorize(policyOps)
    authorizeOps.listAuthorizations({
      userId: 1,
      resource: 'database:pg01:balancesheet',
      action: 'finance:ReadBalanceSheet'
    }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()
      expect(err.message).to.equal('test error')

      done()
    })
  })

  lab.test('isUserAuthorized - should return an error if iam-js returns an error', (done) => {
    var policyOps = {listAllUserPolicies: function (userId, cb) {
      let policies = [{Statement: [{Action: ['finance:ReadBalanceSheet'], Resource: ['database:pg01:balancesheet'], Effect: 'Allow'}]}]
      policies.policyMock = true
      return cb(null, policies)
    }}

    var authorizeOps = Authorize(policyOps)
    authorizeOps.listAuthorizations({
      userId: 1,
      resource: 'database:pg01:balancesheet',
      action: 'finance:ReadBalanceSheet'
    }, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()
      expect(err.message).to.equal('policyMock test error')

      done()
    })
  })
})
