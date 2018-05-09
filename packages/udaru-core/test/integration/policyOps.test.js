'use strict'

/* eslint no-template-curly-in-string: 0 */

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const _ = require('lodash')
const async = require('async')
const uuid = require('uuid/v4')
const Factory = require('../factory')
const testUtils = require('../testUtils')
const udaru = require('../..')()

const config = require('../../config')()
const db = require('../../lib/db')(null, config)
const policyOps = require('../../lib/ops/policyOps')(db, config)

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

  lab.test('create policy with duplicate id should fail', (done) => {
    const policyData = {
      id: 'MyDuplicateId',
      version: '1',
      name: 'Documents Admin',
      organizationId: 'WONKA',
      statements
    }

    udaru.policies.create(policyData, (err, policy) => {
      expect(err).to.not.exist()
      expect(policy).to.exist()

      udaru.policies.create(policyData, (err, policy) => {
        expect(err).to.exist()
        expect(err.output.statusCode).to.equal(409)
        expect(err.message).to.equal('policy already exists')

        udaru.policies.delete({ id: policyData.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('create a policy with long name should fail', (done) => {
    const policyName = 'a'.repeat(65)
    udaru.policies.create({ organizationId: 'WONKA', name: policyName, id: 'longtestid', version: '1', statements }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
    })
  })

  lab.test('create a policy with long id should fail', (done) => {
    const longId = 'a'.repeat(129)
    udaru.policies.create({ organizationId: 'WONKA', name: 'policyName', id: longId, version: '1', statements }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
    })
  })

  lab.experiment('listAllUserPolicies', () => {
    const orgId = 'orgId'
    const alienOrgId = 'alienOrgId'

    const records = Factory(lab, {
      organizations: {
        org: {
          id: orgId,
          name: 'org name',
          policies: [
            { id: 'organizationPolicy' },
            { id: 'policyWithVariablesMulti', variables: { var21: 'org21', var22: 'org22' } },
            { id: 'sharedPolicyWithVariablesAndContext', variables: { varA: 'x' } }
          ],
          description: 'org description'
        },
        alienOrg: {
          id: alienOrgId,
          name: 'alien org name',
          policies: [{id: 'alienPolicy'}],
          description: 'org description'
        }
      },
      teams: {
        userTeam: {
          name: 'user team',
          description: 'user team',
          organizationId: orgId,
          users: ['called'],
          policies: [{
            id: 'teamPolicy'
          }, {
            id: 'policyWithVariablesMulti',
            variables: { var21: 'team21', var22: 'team22' }
          }],
          parent: 'parentTeam'
        },
        parentTeam: {
          name: 'parent team',
          description: 'parent team',
          organizationId: orgId,
          policies: [{id: 'parentPolicy'}]
        }
      },
      users: {
        called: {
          name: 'called',
          description: 'called',
          organizationId: orgId,
          policies: [
            {
              id: 'userPolicy'
            },
            {
              id: 'policyWithoutVariables'
            },
            {
              id: 'policyWithVariables',
              variables: { var1: 'value1' }
            },
            {
              id: 'policyWithVariables',
              variables: { var1: 'value11' }
            },
            {
              id: 'policyWithVariablesMulti',
              variables: { var21: 'user21', var22: 'user22' }
            },
            {
              id: 'sharedPolicy'
            }]
        }
      },
      policies: {
        userPolicy: { name: 'userPolicy', organizationId: orgId },
        teamPolicy: { name: 'teamPolicy', id: 'teamPolicy', organizationId: orgId },
        organizationPolicy: { name: 'organizationPolicy', organizationId: orgId },
        parentPolicy: { name: 'parentPolicy', organizationId: orgId },
        alienPolicy: { name: 'alienPolicy', organizationId: alienOrgId },
        policyWithVariables: {
          name: 'policyWithVariables',
          id: 'policyWithVariables',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${var1}']
            }]
          }
        },
        policyWithVariablesMulti: {
          name: 'policyWithVariablesMulti',
          id: 'policyWithVariablesMulti',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${var21}', '${var22}']
            }]
          }
        },
        policyWithVariablesAndContext: {
          name: 'policyWithVariablesAndContext',
          id: 'policyWithVariablesAndContext',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${varX}', '${varY}', '${udaru.userId}', '${request.currentTime}']
            }]
          }
        },
        policyWithJustContextVars: {
          name: 'policyWithJustContextVars',
          id: 'policyWithJustContextVars',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${udaru.userId}', '${request.currentTime}']
            }]
          }
        },
        policyWithResource: {
          name: 'policyWithResource',
          id: 'policyWithResource',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['xyz']
            }]
          }
        },
        policyWithoutVariables: {
          name: 'policyWithoutVariables',
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${noVar}']
            }]
          }
        }
      },
      sharedPolicies: {
        sharedPolicy: { name: 'sharedPolicy1' },
        unusedPolicy: { name: 'unusedPolicy1' },
        sharedPolicyWithVariablesAndContext: {
          name: 'sharedPolicyWithVariablesAndContext',
          id: 'sharedPolicyWithVariablesAndContext',
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${varA}', '${varB}', '${udaru.userId}', '${request.currentTime}']
            }]
          }
        }
      }
    }, udaru)

    function getName (policy) {
      return policy.Name
    }

    lab.test('loads correct number of policies', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(12)
        done()
      })
    })

    lab.test('lists correct policy variables', (done) => {
      policyOps.readPolicyVariables({ id: 'policyWithVariablesAndContext', organizationId: orgId }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(2)
        expect(results).to.contain('${varX}')
        expect(results).to.contain('${varY}')

        policyOps.readPolicyVariables({ id: 'policyWithJustContextVars', organizationId: orgId }, (err, results) => {
          if (err) return done(err)
          expect(results).to.have.length(0)

          policyOps.readPolicyVariables({ id: 'policyWithResource', organizationId: orgId }, (err, results) => {
            if (err) return done(err)
            expect(results).to.have.length(0)
            done()
          })
        })
      })
    })

    lab.test('lists correct shared policy variables', (done) => {
      policyOps.readPolicyVariables({ id: 'sharedPolicyWithVariablesAndContext', organizationId: orgId, type: 'shared' }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(2)
        expect(results).to.contain('${varA}')
        expect(results).to.contain('${varB}')
        done()
      })
    })

    lab.test('search policies, no results', (done) => {
      policyOps.search({ organizationId: 'WONKA', query: 'bibbidybobbedy' }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(0)
        done()
      })
    })

    lab.test('search policies', (done) => {
      policyOps.search({ organizationId: 'WONKA', query: 'acc' }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(2)
        expect(results[0].name.toLowerCase()).to.contain('acc')
        expect(results[1].name.toLowerCase()).to.contain('acc')
        done()
      })
    })

    lab.test('search shared policies', (done) => {
      policyOps.search({ organizationId: 'WONKA', query: 'pol', type: 'shared' }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(1)
        expect(results[0].name.toLowerCase()).to.contain('pol')
        done()
      })
    })

    lab.test('search all policies', (done) => {
      policyOps.search({ organizationId: 'WONKA', query: 'a', type: 'all' }, (err, results) => {
        if (err) return done(err)
        expect(results).to.have.length(14)
        expect(results[0].name.toLowerCase()).to.contain('a')
        expect(results[6].name.toLowerCase()).to.contain('a')
        expect(results[12].name.toLowerCase()).to.contain('a')
        done()
      })
    })

    lab.test('list policy instances', (done) => {
      policyOps.listPolicyInstances({ id: 'policyWithVariablesMulti', organizationId: orgId, type: 'organization' }, (err, results) => {
        if (err) return done(err)
        expect(results.length).to.equal(3)
        expect(results[0].entityType).to.equal('organization')
        expect(results[0].variables).to.equal({var21: 'org21', var22: 'org22'})
        expect(results[1].entityType).to.equal('team')
        expect(results[1].variables).to.equal({var21: 'team21', var22: 'team22'})
        expect(results[2].entityType).to.equal('user')
        expect(results[2].variables).to.equal({var21: 'user21', var22: 'user22'})
        expect(results.length).to.equal(3)

        let x = 0
        let y = 1
        if (x === y) {

        }

        done()
      })
    })

    lab.test('list policy instances, just user', (done) => {
      policyOps.listPolicyInstances({ id: 'policyWithVariables', organizationId: orgId, type: 'organization' }, (err, results) => {
        if (err) return done(err)
        expect(results.length).to.equal(2)
        expect(results[0].entityType).to.equal('user')
        expect(results[0].variables).to.equal({var1: 'value1'})
        expect(results[1].entityType).to.equal('user')
        expect(results[1].variables).to.equal({var1: 'value11'})
        done()
      })
    })

    lab.test('list policy instances not found', (done) => {
      policyOps.listPolicyInstances({ id: 'policyWithVariablesMulti1', organizationId: orgId, type: 'organization' }, (err, results) => {
        if (err) return done(err)
        expect(results.length).to.equal(0)
        done()
      })
    })

    lab.test('list shared policy instances', (done) => {
      policyOps.listPolicyInstances({ id: 'sharedPolicyWithVariablesAndContext', organizationId: orgId, type: 'shared' }, (err, results) => {
        if (err) return done(err)
        expect(results.length).to.equal(1)
        expect(results[0].entityType).to.equal('organization')
        expect(results[0].variables).to.equal({varA: 'x'})
        done()
      })
    })

    lab.test('list shared policy instances not found', (done) => {
      policyOps.listPolicyInstances({ id: 'sharedPolicy1', organizationId: orgId, type: 'shared' }, (err, results) => {
        if (err) return done(err)
        expect(results.length).to.equal(0)
        done()
      })
    })

    lab.test('loads policies from user', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.userPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user team', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.teamPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user team ancessor', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.parentPolicy.name)
        done()
      })
    })

    lab.test('loads policies from user organization', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.organizationPolicy.name)
        done()
      })
    })

    lab.test('loads shared policies', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.sharedPolicy.name)
        done()
      })
    })

    lab.test('scopes policies by organization', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.not.include(records.alienPolicy.name)
        done()
      })
    })

    lab.test('should support multiple instances of the same policy with different variables', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.policyWithVariables.name)

        const statements = _.chain(results)
          .filter({Name: records.policyWithVariables.name})
          .map('Statement')
          .flatten()
          .value()

        expect(statements).to.include([{
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['value1']
        },
        {
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['value11']
        }
        ])

        done()
      })
    })

    lab.test('should support multiple variables on the same policy instance', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.policyWithVariablesMulti.name)

        const statements = _.chain(results)
          .filter({Name: records.policyWithVariablesMulti.name})
          .map('Statement')
          .flatten()
          .value()

        expect(statements).to.include([{
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['user21', 'user22']
        }
        ])

        done()
      })
    })

    lab.test('should keep variables in resources if no value found for interpolation', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.policyWithoutVariables.name)

        const policy = _.find(results, {Name: records.policyWithoutVariables.name})
        expect(policy.Statement).to.equal([{
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['${noVar}']
        }])

        done()
      })
    })
  })

  lab.experiment('delete policy removes policies from users, teams, organizations', () => {
    const organizationId = 'TestPolicyRemoval'
    const userPolicyId = uuid()
    const teamPolicyId = uuid()
    const organizationPolicyId = uuid()
    const defaultTeamAdminCount = 1
    const defaultOrgAdminCount = 1

    function Policy (policyId) {
      return {
        id: policyId,
        version: '2016-07-01',
        name: 'Test Policy',
        statements,
        organizationId
      }
    }

    const records = Factory(lab, {
      organizations: {
        testedOrg: {
          id: organizationId,
          name: 'org',
          description: 'org',
          policies: [{id: 'organizationPolicy'}]
        }
      },
      teams: {
        userTeam: {
          name: 'user team',
          description: 'user team',
          organizationId: organizationId,
          users: ['called'],
          policies: [{id: 'teamPolicy'}]
        }
      },
      users: {
        called: {
          name: 'called',
          organizationId: organizationId,
          policies: [{id: 'userPolicy'}]
        }
      },
      policies: {
        userPolicy: Policy(userPolicyId),
        teamPolicy: Policy(teamPolicyId),
        organizationPolicy: Policy(organizationPolicyId)
      }
    }, udaru)

    lab.test('check user, team, org policies are correctly attached', (done) => {
      const tasks = []
      tasks.push((next) => {
        udaru.users.read({ id: records.called.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(userPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.teams.read({ id: records.userTeam.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(teamPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(organizationPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.policies.list({ organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(3 + defaultTeamAdminCount + defaultOrgAdminCount)
          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('remove policy removes properly from org, teams and users', (done) => {
      const tasks = []

      tasks.push((next) => {
        policyOps.deletePolicy({ id: userPolicyId, organizationId: organizationId }, (err) => {
          expect(err).to.not.exist()

          next(err)
        })
      })
      tasks.push((next) => {
        policyOps.deletePolicy({ id: teamPolicyId, organizationId: organizationId }, (err) => {
          expect(err).to.not.exist()

          next(err)
        })
      })
      tasks.push((next) => {
        policyOps.deletePolicy({ id: organizationPolicyId, organizationId: organizationId }, (err) => {
          expect(err).to.not.exist()

          next(err)
        })
      })
      tasks.push((next) => {
        udaru.users.read({ id: records.called.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.teams.read({ id: records.userTeam.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.policies.list({ organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultTeamAdminCount + defaultOrgAdminCount)

          next(err, res)
        })
      })

      async.series(tasks, done)
    })
  })

  lab.experiment('delete policy attached to more elements removes policies from users, teams, organizations', () => {
    const organizationId = 'TestPolicyRemoval'
    const testPolicyId = uuid()
    const defaultTeamAdminCount = 1
    const defaultOrgAdminCount = 1

    function Policy (policyId) {
      return {
        id: policyId,
        version: '2016-07-01',
        name: 'Test Policy',
        statements,
        organizationId
      }
    }

    const records = Factory(lab, {
      organizations: {
        testedOrg: {
          id: organizationId,
          name: 'org',
          description: 'org',
          policies: ['testPolicy']
        }
      },
      teams: {
        userTeam: {
          name: 'user team',
          description: 'user team',
          organizationId: organizationId,
          users: ['called'],
          policies: [{id: 'testPolicy'}]
        }
      },
      users: {
        called: {
          name: 'called',
          organizationId: organizationId,
          policies: [{id: 'testPolicy'}]
        }
      },
      policies: {
        testPolicy: Policy(testPolicyId)
      }
    }, udaru)

    lab.test('check user, team, org policies are correctly attached', (done) => {
      const tasks = []
      tasks.push((next) => {
        udaru.users.read({ id: records.called.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.teams.read({ id: records.userTeam.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicyId)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.policies.list({ organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(1 + defaultTeamAdminCount + defaultOrgAdminCount)
          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('remove policy removes properly from org, teams and users', (done) => {
      const tasks = []

      tasks.push((next) => {
        policyOps.deletePolicy({ id: testPolicyId, organizationId: organizationId }, (err) => {
          expect(err).to.not.exist()

          next(err)
        })
      })
      tasks.push((next) => {
        udaru.users.read({ id: records.called.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.teams.read({ id: records.userTeam.id, organizationId: organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.policies.list({ organizationId }, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultTeamAdminCount + defaultOrgAdminCount)

          next(err, res)
        })
      })

      async.series(tasks, done)
    })
  })

  lab.experiment('shared policies', () => {
    lab.beforeEach(function deleteExistingPolicies (done) {
      udaru.policies.listShared({}, (err, result) => {
        if (err) return done(err)

        const ids = _.chain(result)
          .reject(policy => policy.id === 'sharedPolicyId1') // ignore fixture policy
          .map((policy) => _.pick(policy, 'id'))
          .value()

        async.each(ids, udaru.policies.deleteShared, done)
      })
    })

    lab.test('list', done => {
      const policyData = [{
        version: '1',
        name: 'Shared Policy (test)',
        statements
      }, {
        version: '1',
        name: 'Shared Policy (test 2)',
        statements
      }]

      async.each(policyData, udaru.policies.createShared, (err) => {
        expect(err).to.not.exist()

        udaru.policies.listShared({}, (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result.length).to.equal(3) // 3 = 2 created + 1 from fixtures

          const policy = result[0]
          expect(policy.id).to.exist()
          expect(policy.name).to.exist()
          expect(policy.version).to.exist()
          expect(policy.statements).to.exist()

          done()
        })
      })
    })

    lab.test('create', done => {
      const policyData = {
        version: '1',
        name: 'Shared Policy (test)',
        statements
      }

      udaru.policies.createShared(policyData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()
        expect(policy.name).to.equal('Shared Policy (test)')
        expect(policy.version).to.equal('1')
        expect(policy.statements).to.equal(statements)

        done()
      })
    })

    lab.test('read', done => {
      const policyData = {
        version: '1',
        name: 'Shared Policy (test 2)',
        statements
      }

      udaru.policies.createShared(policyData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        const policyId = policy.id

        udaru.policies.readShared({id: policyId}, (err, policy) => {
          expect(err).to.not.exist()
          expect(policy).to.exist()

          expect(policy.name).to.equal('Shared Policy (test 2)')
          expect(policy.version).to.equal('1')
          expect(policy.statements).to.equal(statements)

          done()
        })
      })
    })

    lab.test('delete', (done) => {
      const policyData = {
        version: '1',
        name: 'Documents Admin',
        statements
      }

      udaru.policies.createShared(policyData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        const policyId = policy.id

        expect(policy.name).to.equal('Documents Admin')
        expect(policy.version).to.equal('1')
        expect(policy.statements).to.equal(statements)

        udaru.policies.deleteShared({ id: policyId }, (err) => {
          expect(err).to.not.exist()

          udaru.policies.readShared({ id: policyId }, (err) => {
            expect(err).to.exist()

            done()
          })
        })
      })
    })

    lab.test('update', (done) => {
      const policyData = {
        version: '1',
        name: 'Documents Admin',
        statements
      }

      udaru.policies.createShared(policyData, (err, policy) => {
        expect(err).to.not.exist()
        expect(policy).to.exist()

        const policyId = policy.id

        expect(policy.name).to.equal('Documents Admin')
        expect(policy.version).to.equal('1')
        expect(policy.statements).to.equal(statements)

        const updateData = {
          id: policyId,
          version: '2',
          name: 'Documents Admin v2',
          statements: { Statement: [{ Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }
        }

        udaru.policies.updateShared(updateData, (err, policy) => {
          expect(err).to.not.exist()
          expect(policy).to.exist()

          expect(policy.name).to.equal('Documents Admin v2')
          expect(policy.version).to.equal('2')
          expect(policy.statements).to.equal({ Statement: [{ Effect: 'Deny', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] })

          udaru.policies.deleteShared({ id: policyId }, done)
        })
      })
    })
  })
})

lab.experiment('Policies - root user impersonating', () => {
  const newOrgPolicyId = 'newOrgPolicyId'
  const newOrgId = 'newOrgId'
  const rootUserId = 'rootUserId'
  const rootOrgId = 'ROOT'

  const records = Factory(lab, {
    organizations: {
      org1: {
        id: newOrgId,
        name: 'Test Organization',
        description: 'Test Organization',
        policies: [{id: 'testPolicy'}]
      }
    },
    users: {
      RootUser: {
        id: rootUserId,
        name: 'Root User',
        organizationId: rootOrgId,
        policies: [{id: 'rootUserPolicy'}]
      }
    },
    policies: {
      testPolicy: {
        id: newOrgPolicyId,
        name: 'newOrgPolicyId',
        organizationId: newOrgId,
        statements: testUtils.AllowStatement(['read'], ['org:documents'])
      },
      rootUserPolicy: {
        id: 'rootUserPolicy',
        name: 'rootUserPolicy',
        organizationId: 'ROOT',
        statements: testUtils.AllowStatement(['*'], ['*'])
      }
    }
  }, udaru)

  function getName (policy) {
    return policy.Name
  }

  lab.test('load invalid user policies', (done) => {
    policyOps.listAllUserPolicies({ userId: 'invalid_user_id', organizationId: newOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(0)

      done()
    })
  })

  lab.test('load invalid org policies', (done) => {
    policyOps.listAllUserPolicies({ userId: 'CharlieId', organizationId: rootOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(0)

      done()
    })
  })

  lab.test('load invalid org policies', (done) => {
    policyOps.listAllUserPolicies({ userId: 'CharlieId', organizationId: newOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(0)

      done()
    })
  })

  lab.test('load invalid user and invalid org policies', (done) => {
    policyOps.listAllUserPolicies({ userId: 'invalid_user_id', organizationId: newOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(0)

      done()
    })
  })

  lab.test('load root user policies', (done) => {
    policyOps.listAllUserPolicies({ userId: records.RootUser.id, organizationId: rootOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(1)
      expect(results.map(getName)).to.include(records.rootUserPolicy.name)

      done()
    })
  })

  lab.test('load root user policies when impersonating organization', (done) => {
    policyOps.listAllUserPolicies({ userId: records.RootUser.id, organizationId: newOrgId }, (err, results) => {
      if (err) return done(err)

      expect(results.length).to.equal(1)
      expect(results.map(getName)).to.include(records.rootUserPolicy.name)

      done()
    })
  })
})
