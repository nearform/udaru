'use strict'

/* eslint no-template-curly-in-string: 0 */

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const _ = require('lodash')
const async = require('async')
const uuid = require('uuid/v4')
const Factory = require('../factory')
const testUtils = require('../utils')
const { udaru } = testUtils

const config = require('../../lib/config/build-all')()
const db = require('../../lib/core/lib/db')(null, config)
const policyOps = require('../../lib/core/lib/ops/policyOps')(db, config)

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
        expect(err.output.statusCode).to.equal(400)
        expect(err.message).to.match(/Policy with id MyDuplicateId already present/)

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
          policies: ['organizationPolicy'],
          description: 'org description'
        },
        alienOrg: {
          id: alienOrgId,
          name: 'alien org name',
          policies: ['alienPolicy'],
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
            key: 'teamPolicy'
          }, {
            key: 'policyWithVariablesMulti',
            variables: {var2: 'value3'}
          }],
          parent: 'parentTeam'
        },
        parentTeam: {
          name: 'parent team',
          description: 'parent team',
          organizationId: orgId,
          policies: ['parentPolicy']
        }
      },
      users: {
        called: {
          name: 'called',
          description: 'called',
          organizationId: orgId,
          policies: [{
            key: 'userPolicy'
          }, {
            key: 'policyWithoutVariables'
          }, {
            key: 'policyWithVariables',
            variables: {var1: 'value1'}
          }, {
            key: 'policyWithVariablesMulti',
            variables: {var2: 'value2'}
          }]
        }
      },
      policies: {
        userPolicy: { name: 'userPolicy', organizationId: orgId },
        teamPolicy: { name: 'teamPolicy', organizationId: orgId },
        organizationPolicy: { name: 'organizationPolicy', organizationId: orgId },
        parentPolicy: { name: 'parentPolicy', organizationId: orgId },
        alienPolicy: { name: 'alienPolicy', organizationId: alienOrgId },
        policyWithVariables: {
          name: 'policyWithVariables',
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
          organizationId: orgId,
          statements: {
            Statement: [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['${var2}']
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
      }
    })

    function getName (policy) {
      return policy.Name
    }

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

    lab.test('scopes policies by organization', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.not.include(records.alienPolicy.name)
        done()
      })
    })

    lab.test('should interpolate variables provided on policy assignment', (done) => {
      policyOps.listAllUserPolicies({ userId: records.called.id, organizationId: orgId }, (err, results) => {
        if (err) return done(err)

        expect(results.map(getName)).to.include(records.policyWithVariables.name)

        const policy = _.find(results, {Name: records.policyWithVariables.name})
        expect(policy.Statement).to.equal([{
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['value1']
        }])

        done()
      })
    })

    lab.test('should support multiple instances of the same policy with different variables', (done) => {
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
          Resource: ['value2']
        }, {
          Effect: 'Allow',
          Action: ['dummy'],
          Resource: ['value3']
        }])

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
          policies: ['organizationPolicy']
        }
      },
      teams: {
        userTeam: {
          name: 'user team',
          description: 'user team',
          organizationId: organizationId,
          users: ['called'],
          policies: ['teamPolicy']
        }
      },
      users: {
        called: {
          name: 'called',
          organizationId: organizationId,
          policies: ['userPolicy']
        }
      },
      policies: {
        userPolicy: Policy(userPolicyId),
        teamPolicy: Policy(teamPolicyId),
        organizationPolicy: Policy(organizationPolicyId)
      }
    })

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
          policies: ['testPolicy']
        }
      },
      users: {
        called: {
          name: 'called',
          organizationId: organizationId,
          policies: ['testPolicy']
        }
      },
      policies: {
        testPolicy: Policy(testPolicyId)
      }
    })

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
        policies: ['testPolicy']
      }
    },
    users: {
      RootUser: {
        id: rootUserId,
        name: 'Root User',
        organizationId: rootOrgId,
        policies: ['rootUserPolicy']
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
  })

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
