'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const PolicyOps = require('../../../lib/policyOps')
const dbConn = require('../../../lib/dbConn')
const logger = require('pino')()

const db = dbConn.create(logger)
const policyOps = PolicyOps(db.pool)

lab.experiment('PolicyOps', () => {
  lab.test('list policies', (done) => {
    policyOps.listAllPolicies({}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length !== 0).to.be.true()

      done()
    })
  })

  lab.test('list all policies full', (done) => {
    policyOps.listAllPoliciesDetails({}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()

      const policy = result[0]
      expect(policy.id).to.exist()
      expect(policy.name).to.exist()
      expect(policy.version).to.exist()
      expect(policy.statements).to.exist()

      done()
    })
  })

  lab.test('read a specific policy', (done) => {
    policyOps.readPolicyById([1], (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      expect(policy.id).to.exist()
      expect(policy.name).to.exist()
      expect(policy.version).to.exist()
      expect(policy.statements).to.exist()

      done()
    })
  })

  lab.test('create, update and delete a policy', (done) => {
    var params = ['2016-07-01', 'Documents Admin', 'WONKA', '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}']
    var policyId

    policyOps.createPolicy(params, (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      policyId = policy.id

      expect(policy.name).to.equal('Documents Admin')
      expect(policy.version).to.equal('2016-07-01')
      expect(policy.statements).to.equal({Statement: [{Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*']}]})

      params[0] = '2016-07-02'
      params[1] = 'Documents Admin v2'
      params[3] = '{"Statement":[{"Effect":"Deny","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'

      policyOps.updatePolicy([policyId, ...params], (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        expect(policy.name).to.equal('Documents Admin v2')
        expect(policy.version).to.equal('2016-07-02')
        expect(policy.statements).to.equal({Statement: [{Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*']}]})

        policyOps.deletePolicyById([policyId], done)
      })
    })
  })
})
