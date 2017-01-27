'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const policyOps = require('../../../src/lib/ops/policyOps')
const Factory = require('../../factory')
const db = require('../../../src/lib/db/index')
const SQL = require('../../../src/lib/db/SQL')

const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

lab.experiment('PolicyOps', () => {
  lab.test('list all organization policies', (done) => {
    policyOps.listByOrganization({ organizationId: 'WONKA' }, (err, result) => {
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
    policyOps.readPolicy({ id: 'policyId1', organizationId: 'WONKA' }, (err, policy) => {
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

    policyOps.createPolicy(policyData, (err, policy) => {
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

      policyOps.updatePolicy(updateData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        expect(policy.name).to.equal('Documents Admin v2')
        expect(policy.version).to.equal('2')
        expect(policy.statements).to.equal({ Statement: [{ Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] })

        policyOps.deletePolicy({ id: policyId, organizationId: 'WONKA' }, done)
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

    policyOps.createPolicy(policyData, (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      expect(policy.id).to.equal('MySpecialId')
      expect(policy.name).to.equal('Documents Admin')
      expect(policy.version).to.equal('1')
      expect(policy.statements).to.equal(statements)

      policyOps.deletePolicy({ id: policy.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.experiment('listAllUserPolicies', () => {
    const records = Factory(lab, {
      teams: {
        userTeam: {
          name: 'user team',
          description: 'user team',
          organizationId: 'WONKA',
          users: ['called'],
          policies: ['teamPolicy'],
          parent: 'parentTeam'
        },
        parentTeam: {
          name: 'parent team',
          description: 'parent team',
          organizationId: 'WONKA',
          policies: ['parentPolicy']
        }
      },
      users: {
        called: {
          name: 'called',
          description: 'called',
          organizationId: 'WONKA',
          policies: ['userPolicy']
        }
      },
      policies: {
        userPolicy: { name: 'userPolicy' },
        teamPolicy: { name: 'teamPolicy' },
        parentPolicy: { name: 'parentPolicy' },
        alienPolicy: { name: 'alienPolicy', organizationId: 'OILCOEMEA' }
      }
    })

    lab.beforeEach((done) => {
      // doing this directly because policyOps correctly return an error when adding a policy from another org
      db.query(SQL`INSERT INTO team_policies (team_id, policy_id) VALUES (${records.userTeam.id}, ${records.alienPolicy.id})`, done)
    })

    function getName (policy) {
      return policy.Name
    }

    lab.test('loads policies from user', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: 'WONKA' }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.userPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user team', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: 'WONKA' }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.teamPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user team ancessor', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: 'WONKA' }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.parentPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user organization')

    lab.test('scopes policies by organization', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: 'WONKA' }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.not.include(records.alienPolicy.name)
        done()
      })
    })
  })
})
