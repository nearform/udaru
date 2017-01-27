'use strict'

const path = require('path')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const loader = require('../../lib/policiesLoader')
const testUtils = require('../utils')
const { udaru } = testUtils

const organizationId = 'WONKA'

lab.experiment('policiesLoader', () => {
  lab.test('should load policies from file and save them in the db', (done) => {
    loader.load(organizationId, path.join(__dirname, 'fixtures/policies_for_loader-WONKA.json'), (err) => {
      expect(err).to.not.exist()

      udaru.policies.read({ id: 'policyIdTESTLOADER', organizationId }, (err, policy) => {
        expect(err).to.not.exist()

        expect(policy.id).to.equal('policyIdTESTLOADER')
        expect(policy.name).to.equal('Director')
        expect(policy.statements.Statement.length).to.equal(5)

        udaru.policies.delete({ id: 'policyIdTESTLOADER', organizationId }, done)
      })
    }, false)
  })

  lab.test('the organizationId specified on the file should override the one specified in the function input', (done) => {
    loader.load(organizationId, path.join(__dirname, 'fixtures/policies_for_loader-ROOT.json'), (err) => {
      expect(err).to.not.exist()

      udaru.policies.read({ id: 'policyIdTESTLOADER-ROOT', organizationId: 'ROOT' }, (err, policy) => {
        expect(err).to.not.exist()

        expect(policy.id).to.equal('policyIdTESTLOADER-ROOT')
        expect(policy.name).to.equal('Director')
        expect(policy.statements.Statement.length).to.equal(5)

        udaru.policies.delete({ id: 'policyIdTESTLOADER-ROOT', organizationId: 'ROOT' }, done)
      })
    }, false)
  })
})
