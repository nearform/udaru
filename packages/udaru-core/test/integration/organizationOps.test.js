'use strict'

const expect = require('code').expect
const uuid = require('uuid/v4')
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')
const udaru = require('../..')()
const u = require('../testUtils')

const config = require('../../config')()
const defaultPolicies = config.get('authorization.organizations.defaultPolicies', { 'organizationId': 'nearForm' })
const defaultPoliciesNames = Object.keys(defaultPolicies).map((pName) => {
  let policy = defaultPolicies[pName]
  return policy.name
})

const organizationId = 'nearFormTest'
const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }
const testPolicy = {
  id: uuid(),
  version: '2016-07-01',
  name: 'Test Policy Org',
  organizationId: organizationId,
  statements: statements
}
const testPolicy2 = {
  id: uuid(),
  version: '2016-07-02',
  name: 'Test Policy Org2',
  organizationId: organizationId,
  statements: statements
}

lab.experiment('OrganizationOps', () => {
  lab.beforeEach((done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.organizations.create({ id: organizationId, name: organizationId, description: 'organization description' }, next)
    })
    tasks.push((next) => {
      udaru.policies.create(testPolicy, next)
    })
    tasks.push((next) => {
      udaru.policies.create(testPolicy2, next)
    })

    async.series(tasks, done)
  })

  lab.afterEach((done) => {
    udaru.organizations.delete(organizationId, done)
  })

  lab.test('list of all organizations', (done) => {
    udaru.organizations.list({page: 1, limit: 8}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(7)

      done()
    })
  })

  lab.test('create an organization (and delete it) should create the organization default policies', (done) => {
    udaru.organizations.create({ id: 'nearForm', name: 'nearForm', description: 'nearform description' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result.organization).to.exist()
      expect(result.organization.name).to.equal('nearForm')

      udaru.policies.list({organizationId: 'nearForm'}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.be.at.least(defaultPoliciesNames.length)

        let policiesNames = res.map(p => p.name).sort()
        expect(policiesNames).to.equal(defaultPoliciesNames)

        udaru.organizations.delete(result.organization.id, done)
      })
    })
  })

  lab.test('create an organization (and delete it) with createOnly option should only create the organization (no default policies)', (done) => {
    const organizationData = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm description'
    }
    udaru.organizations.create(organizationData, { createOnly: true }, (err, result) => {
      expect(err).to.not.exist()
      expect(result.organization).to.exist()
      expect(result.organization.name).to.equal('nearForm')

      udaru.policies.list({organizationId: 'nearForm'}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res).to.be.empty()

        udaru.organizations.delete(result.organization.id, done)
      })
    })
  })

  lab.test('create twice an organization with the same id should fail second time', (done) => {
    const organizationData = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm description'
    }
    udaru.organizations.create(organizationData, { createOnly: true }, (err, result) => {
      expect(err).to.not.exist()
      expect(result.organization).to.exist()
      expect(result.organization.name).to.equal('nearForm')

      udaru.organizations.create(organizationData, { createOnly: true }, (err, result) => {
        expect(err).to.exist()
        expect(err.output.statusCode).to.equal(409)
        expect(err.message).to.equal('Key (id)=(nearForm) already exists.')

        udaru.organizations.delete(organizationData.id, done)
      })
    })
  })

  lab.test('create an organization specifying a user should create the user and assign the OrgAdmin policy to it', (done) => {
    udaru.organizations.create({
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearform description',
      user: {
        name: 'example example'
      }
    }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.organization).to.exist()
      expect(result.organization.name).to.equal('nearForm')
      expect(result.user).to.exist()
      expect(result.user.name).to.equal('example example')
      expect(result.user.id).to.not.be.null()

      udaru.users.list({ organizationId: 'nearForm' }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(1)
        expect(res[0].name).to.equal('example example')

        udaru.users.read({ id: res[0].id, organizationId: 'nearForm' }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.teams.length).to.equal(0)

          udaru.organizations.delete(result.organization.id, (err, res) => {
            expect(err).to.not.exist()

            udaru.users.list({ organizationId: 'nearForm' }, (err, res) => {
              expect(err).to.not.exist()
              expect(res.length).to.equal(0)
              done()
            })
          })
        })
      })
    })
  })

  lab.test('create an organization specifying a user and its id, should create the user and assign the OrgAdmin policy to it', (done) => {
    udaru.organizations.create({
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearform description',
      user: {
        id: 'myspecialid',
        name: 'example example'
      }
    }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.organization).to.exist()
      expect(result.organization.name).to.equal('nearForm')
      expect(result.user).to.exist()
      expect(result.user.name).to.equal('example example')
      expect(result.user.id).to.equal('myspecialid')

      udaru.users.list({ organizationId: 'nearForm' }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(1)
        expect(res[0].name).to.equal('example example')

        udaru.users.read({ id: res[0].id, organizationId: 'nearForm' }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.teams.length).to.equal(0)

          udaru.organizations.delete(result.organization.id, (err, res) => {
            expect(err).to.not.exist()

            udaru.users.list({ organizationId: 'nearForm' }, (err, res) => {
              expect(err).to.not.exist()
              expect(res.length).to.equal(0)
              done()
            })
          })
        })
      })
    })
  })

  lab.test('create an organization with long name should fail', (done) => {
    const orgName = 'a'.repeat(65)
    udaru.organizations.create({ id: 'nearForm', name: orgName, description: 'nearform description' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
    })
  })

  lab.test('create an organization with long id should fail', (done) => {
    const longId = 'a'.repeat(129)
    udaru.organizations.create({ id: longId, name: 'nearform', description: 'nearform description' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
    })
  })

  lab.test('update an organization', (done) => {
    const createData = { id: 'nearForm1', name: 'nearForm', description: 'nearform description' }
    const updateData = { id: 'nearForm1', name: 'nearFormUp', description: 'nearFormUp desc up', policies: [] }

    udaru.organizations.create(createData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.organization.name).to.equal('nearForm')

      udaru.organizations.update(updateData, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res).to.equal(updateData)

        udaru.organizations.delete(result.organization.id, done)
      })
    })
  })

  lab.test('create and update organization with meta', (done) => {
    const metadata1 = {keya: 'vala', keyb: 'valb'}
    const metadata2 = {keyx: 'valx', keyy: 'valy'}
    const createData = { id: 'nearForm1', name: 'nearForm', description: 'nearform description', metadata: metadata1 }
    const updateData = { id: 'nearForm1', name: 'nearFormUp', description: 'nearFormUp desc up', metadata: metadata2, policies: [] }

    udaru.organizations.create(createData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.organization.name).to.equal('nearForm')
      expect(result.organization.metadata).to.equal(metadata1)

      udaru.organizations.update(updateData, (err, res) => {
        expect(err).to.not.exist()

        udaru.organizations.read(updateData.id, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res).to.equal(updateData)
          udaru.organizations.delete(result.organization.id, done)
        })
      })
    })
  })

  lab.test('get a specific organization', (done) => {
    const expected = { id: 'CONCH', name: 'Conch Plc', description: 'Global fuel distributors', policies: [] }
    udaru.organizations.read('CONCH', (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('get a specific organization that does not exist', (done) => {
    udaru.organizations.read('I_do_not_exist', (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('deleting an organization should remove teams and members from that organization', (done) => {
    let teamId, userId

    const policy = {
      version: '2016-07-01',
      name: 'Documents Admin',
      organizationId: 'nearForm222',
      statements
    }

    const tasks = []
    tasks.push((next) => {
      udaru.users.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.teams.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.policies.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.organizations.list({page: 1, limit: 8}, (err, result) => {
        expect(result.length).to.equal(7)
        next(err, result)
      })
    })

    tasks.push((next) => {
      udaru.organizations.create({ id: 'nearForm222', name: 'nearForm222', description: 'nearform description' }, next)
    })
    tasks.push((next) => {
      const teamData = {
        name: 'Team 4',
        description: 'This is a test team',
        parentId: null,
        organizationId: 'nearForm222'
      }
      udaru.teams.create(teamData, function (err, result) {
        if (err) return next(err)

        teamId = result.id
        next()
      })
    })
    tasks.push((next) => {
      const userData = {
        name: 'Grandma Josephine',
        organizationId: 'nearForm222'
      }
      udaru.users.create(userData, function (err, result) {
        if (err) return next(err)

        userId = result.id
        next()
      })
    })
    tasks.push((next) => {
      udaru.policies.create(policy, function (err, result) {
        if (err) return next(err)
        next()
      })
    })
    tasks.push((next) => {
      const teamData = {
        id: teamId,
        name: 'Team 4',
        description: 'This is a test team',
        users: [userId],
        organizationId: 'nearForm222'
      }
      udaru.teams.update(teamData, next)
    })
    tasks.push((next) => {
      const updateUserData = {
        id: userId,
        organizationId: 'nearForm222',
        name: 'user user',
        teams: [teamId]
      }
      udaru.users.update(updateUserData, next)
    })
    tasks.push((next) => {
      udaru.organizations.delete('nearForm222', next)
    })

    tasks.push((next) => {
      udaru.users.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.teams.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.policies.list({ organizationId: 'nearForm222' }, (err, result) => {
        expect(result.length).to.equal(0)
        next(err, result)
      })
    })
    tasks.push((next) => {
      udaru.organizations.list({page: 1, limit: 8}, (err, result) => {
        expect(result.length).to.equal(7)
        next(err, result)
      })
    })

    async.series(tasks, done)
  })

  lab.test('add policies to an organization that has default policies', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('add policies with variables to an organization', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      const policies = [{
        id: testPolicy.id,
        variables: {var1: 'value1'}
      }]
      udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        expect(res.policies[0].variables).to.equal({var1: 'value1'})
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        expect(res.policies[0].variables).to.equal({var1: 'value1'})
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('add empty policy array to an organization that has default policies', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: []}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('add shared policies to an organization', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: ['sharedPolicyId1']}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal('sharedPolicyId1')
        expect(res.policies[0].name).to.equal('Shared policy from fixtures')
        expect(res.policies[0].version).to.equal('0.1')
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal('sharedPolicyId1')
        expect(res.policies[0].name).to.equal('Shared policy from fixtures')
        expect(res.policies[0].version).to.equal('0.1')
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('replace organization policies', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.replacePolicies({id: organizationId, policies: [testPolicy2.id]}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy2.id)
        expect(res.policies[0].name).to.equal(testPolicy2.name)
        expect(res.policies[0].version).to.equal(testPolicy2.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy2.id)
        expect(res.policies[0].name).to.equal(testPolicy2.name)
        expect(res.policies[0].version).to.equal(testPolicy2.version)
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('replace organization policies with variables', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      const policies = [{
        id: testPolicy.id,
        variables: {var1: 'value1'}
      }]

      udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        expect(res.policies[0].variables).to.equal({var1: 'value1'})
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        expect(res.policies[0].variables).to.equal({var1: 'value1'})
        next(err, res)
      })
    })
    tasks.push((next) => {
      const policies = [{
        id: testPolicy2.id,
        variables: {var1: 'value2'}
      }]
      udaru.organizations.replacePolicies({id: organizationId, policies}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy2.id)
        expect(res.policies[0].name).to.equal(testPolicy2.name)
        expect(res.policies[0].version).to.equal(testPolicy2.version)
        expect(res.policies[0].variables).to.equal({var1: 'value2'})
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy2.id)
        expect(res.policies[0].name).to.equal(testPolicy2.name)
        expect(res.policies[0].version).to.equal(testPolicy2.version)
        expect(res.policies[0].variables).to.equal({var1: 'value2'})
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('replace organization policies with shared policies', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.replacePolicies({id: organizationId, policies: ['sharedPolicyId1']}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal('sharedPolicyId1')
        expect(res.policies[0].name).to.equal('Shared policy from fixtures')
        expect(res.policies[0].version).to.equal('0.1')
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal('sharedPolicyId1')
        expect(res.policies[0].name).to.equal('Shared policy from fixtures')
        expect(res.policies[0].version).to.equal('0.1')
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('replace organization policies with invalid policy ID', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.organizations.replacePolicies({id: organizationId, policies: ['InvalidID']}, (err, res) => {
        expect(err).to.exist()
        expect(res).to.not.exist()
        next(err, res)
      })
    })

    async.series(tasks, (err) => {
      expect(err).to.exist()
      done()
    })
  })

  lab.test('delete policies attached to an organization that has default policies created', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({ organizationId }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({ id: organizationId, policies: [testPolicy.id] }, (err, res) => {
        expect(err).to.not.exist()
        expect(res.id).to.equal(organizationId)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.deletePolicies({ id: organizationId }, (err, res) => {
        expect(err).to.not.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.policies.list({ organizationId }, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.test('delete specific policy attached to an organization', (done) => {
    const tasks = []

    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
        expect(err).to.not.exist()
        expect(res.id).to.equal(organizationId)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(1)
        expect(res.policies[0].id).to.equal(testPolicy.id)
        expect(res.policies[0].name).to.equal(testPolicy.name)
        expect(res.policies[0].version).to.equal(testPolicy.version)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.deletePolicy({id: organizationId, policyId: testPolicy.id}, (err, res) => {
        expect(err).to.not.exist()
        expect(res.id).to.equal(organizationId)
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.organizations.read(organizationId, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.policies.length).to.equal(0)
        next(err, res)
      })
    })
    tasks.push((next) => {
      udaru.policies.list({organizationId}, (err, res) => {
        expect(err).to.not.exist()
        expect(res).to.exist()
        expect(res.length).to.equal(defaultPoliciesNames.length + 2)
        next(err, res)
      })
    })

    async.series(tasks, done)
  })

  lab.experiment('multiple policies - ', () => {
    lab.test('add same policy without variables twice 409 conflict', (done) => {
      const tasks = []

      tasks.push((next) => {
        udaru.policies.list({organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultPoliciesNames.length + 2)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]}, (err, res) => {
          expect(err).to.exist()
          expect(err.output.statusCode).to.equal(409)
          next()
        })
      })

      async.series(tasks, done)
    })

    lab.test('with different variables add twice', (done) => {
      const tasks = []

      tasks.push((next) => {
        udaru.policies.list({organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultPoliciesNames.length + 2)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value2'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])

          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('update instances', (done) => {
      const tasks = []

      let instance1 = 0
      let instance2 = 0

      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          expect(res.policies[0].instance).to.exist()
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value2'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])

          instance1 = res.policies[0].instance
          instance2 = res.policies[1].instance

          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          instance: instance1,
          variables: {var1: 'valuex'}
        }, {
          id: testPolicy.id,
          instance: instance2,
          variables: {var1: 'valuey'}
        }]
        udaru.organizations.amendPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(2)
          expect(res.policies).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'valuex'},
            instance: instance1
          }, {
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'valuey'},
            instance: instance2
          }])

          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('update instances conflict', (done) => {
      const tasks = []

      let instance1 = 0
      let instance2 = 0

      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          expect(res.policies[0].instance).to.exist()
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value2'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])

          instance1 = res.policies[0].instance
          instance2 = res.policies[1].instance

          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          instance: instance1,
          variables: {var1: 'valuex'}
        }, {
          id: testPolicy.id,
          instance: instance2,
          variables: {var1: 'valuex'}
        }]
        udaru.organizations.amendPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.exist()
          expect(err.output.statusCode).to.equal(409)
          next()
        })
      })

      async.series(tasks, done)
    })

    lab.test('list policies', (done) => {
      const tasks = []

      tasks.push((next) => {
        udaru.policies.list({organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultPoliciesNames.length + 2)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.listPolicies({id: organizationId, organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.data.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.listPolicies({id: organizationId, organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.data.length).to.equal(1)
          expect(res.data[0].id).to.equal(testPolicy.id)
          expect(res.data[0].name).to.equal(testPolicy.name)
          expect(res.data[0].version).to.equal(testPolicy.version)
          expect(res.data[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value2'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.listPolicies({ organizationId, id: organizationId, page: 1, limit: 100 }, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.data.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.data)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])

          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('test policy instance addition and removal', (done) => {
      const tasks = []

      var firstInstance
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          expect(res.policies[0].instance).to.exist()
          firstInstance = res.policies[0].instance
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value2'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value2'}
          }])
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value3'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(3)
          expect(u.PoliciesWithoutInstance(res.policies)).to.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value3'}
          }])
          next(err, res)
        })
      })
      tasks.push((next) => { // delete the first policy instance
        udaru.organizations.deletePolicy({id: organizationId, policyId: testPolicy.id, instance: firstInstance}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(res.policies)).to.not.include([{
            id: testPolicy.id,
            name: testPolicy.name,
            version: testPolicy.version,
            variables: {var1: 'value1'}
          }])
          next(err, res)
        })
      })
      tasks.push((next) => { // delete remaining instances
        udaru.organizations.deletePolicy({id: organizationId, policyId: testPolicy.id}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })

      async.series(tasks, done)
    })

    lab.test('with same variables do nothing', (done) => {
      const tasks = []

      tasks.push((next) => {
        udaru.policies.list({organizationId}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.length).to.equal(defaultPoliciesNames.length + 2)
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(0)
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.id).to.equal(organizationId)
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res).to.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)
          expect(res.policies[0].name).to.equal(testPolicy.name)
          expect(res.policies[0].version).to.equal(testPolicy.version)
          expect(res.policies[0].variables).to.equal({var1: 'value1'})
          next(err, res)
        })
      })
      tasks.push((next) => {
        const policies = [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
        udaru.organizations.addPolicies({id: organizationId, policies}, (err, res) => {
          expect(err).to.exist()
          expect(err.output.statusCode).to.equal(409)
          next()
        })
      })

      async.series(tasks, done)
    })
  })
})
