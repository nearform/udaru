'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const testUtils = require('../../utils')
const { udaru } = testUtils

const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

lab.experiment('PolicyOps', () => {
  lab.test('list all organization policies', (done) => {
    udaru.policies.list({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(13)

      const policy = result[0]
      expect(policy.id).to.exist()
      expect(policy.name).to.exist()
      expect(policy.version).to.exist()
      expect(policy.statements).to.exist()

      done()
    })
  })

  lab.test('read a specific policy', (done) => {
    udaru.policies.read({ id: 'policyId1', organizationId: 'WONKA' }, (err, policy) => {
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
    const policyData = {
      version: '1',
      name: 'Documents Admin',
      organizationId: 'WONKA',
      statements
    }

    udaru.policies.create(policyData, (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      const policyId = policy.id

      expect(policy.name).to.equal('Documents Admin')
      expect(policy.version).to.equal('1')
      expect(policy.statements).to.equal(statements)

      const updateData = {
        id: policyId,
        organizationId: 'WONKA',
        version: '2',
        name: 'Documents Admin v2',
        statements: { Statement: [{ Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }
      }

      udaru.policies.update(updateData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        expect(policy.name).to.equal('Documents Admin v2')
        expect(policy.version).to.equal('2')
        expect(policy.statements).to.equal({ Statement: [{ Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] })

        udaru.policies.delete({ id: policyId, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('create policy with specific id', (done) => {
    const policyData = {
      id: 'MySpecialId',
      version: '1',
      name: 'Documents Admin',
      organizationId: 'WONKA',
      statements
    }

    udaru.policies.create(policyData, (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      expect(policy.id).to.equal('MySpecialId')
      expect(policy.name).to.equal('Documents Admin')
      expect(policy.version).to.equal('1')
      expect(policy.statements).to.equal(statements)

      udaru.policies.delete({ id: policy.id, organizationId: 'WONKA' }, done)
    })
  })
})
