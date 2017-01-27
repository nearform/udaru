'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const async = require('async')

const testUtils = require('../../utils')
const { udaru } = testUtils

const config = require('../../../src/hapi-udaru/lib/config')
const defaultPolicies = config.get('authorization.organizations.defaultPolicies', { 'organizationId': 'nearForm' })
const defaultPoliciesNames = Object.keys(defaultPolicies).map((pName) => {
  let policy = defaultPolicies[pName]
  return policy.name
})

const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

lab.experiment('OrganizationOps', () => {
  lab.test('list of all organizations', (done) => {
    udaru.organizations.list({page: 1, limit: 7}, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.length).to.equal(6)

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

  lab.test('update an organization', (done) => {
    const createData = { id: 'nearForm1', name: 'nearForm', description: 'nearform description' }
    const updateData = { id: 'nearForm1', name: 'nearFormUp', description: 'nearFormUp desc up' }

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

  lab.test('get a specific organization', (done) => {
    const expected = { id: 'CONCH', name: 'Conch Plc', description: 'Global fuel distributors' }
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
      udaru.organizations.list({page: 1, limit: 7}, (err, result) => {
        expect(result.length).to.equal(6)
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
      udaru.organizations.list({page: 1, limit: 7}, (err, result) => {
        expect(result.length).to.equal(6)
        next(err, result)
      })
    })

    async.series(tasks, done)
  })
})
