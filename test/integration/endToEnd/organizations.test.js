'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../utils')
const uuid = require('uuid/v4')
const server = require('../../../lib/server')
const { udaru } = utils

const organizationId = 'SHIPLINE'
const statementsTest = { Statement: [{ Effect: 'Allow', Action: ['nfdocuments:Read'], Resource: ['nearform:documents:/public/*'] }] }
const testPolicy = {
  id: uuid(),
  version: '2016-07-01',
  name: 'Test Policy Org',
  organizationId: organizationId,
  statements: statementsTest
}
const testPolicy2 = {
  id: uuid(),
  version: '2016-07-02',
  name: 'Test Policy Org2',
  organizationId: organizationId,
  statements: statementsTest
}

lab.experiment('Organizations', () => {
  lab.before((done) => {
    udaru.policies.create(testPolicy, (err, p) => {
      if (err) return done(err)
      udaru.policies.create(testPolicy2, done)
    })
  })

  lab.after((done) => {
    udaru.organizations.deletePolicy({ id: organizationId, policyId: testPolicy.id }, (err) => {
      if (err) return done(err)
      udaru.organizations.deletePolicy({ id: organizationId, policyId: testPolicy2.id }, done)
    })
  })

  lab.test('get organizations list has default pagination params', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result).to.exist()
      expect(response.result.page).to.equal(1)
      expect(response.result.total).greaterThan(1)
      expect(response.result.limit).greaterThan(1)
      done()
    })
  })

  lab.test('get organizations list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=10&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result
      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(10)
      expect(result.total).to.equal(6)
      expect(result.data).to.equal([
        {
          id: 'CONCH',
          name: 'Conch Plc',
          description: 'Global fuel distributors'
        },
        {
          id: 'OILCOEMEA',
          name: 'Oilco EMEA',
          description: 'Oilco EMEA Division'
        },
        {
          id: 'OILCOUSA',
          name: 'Oilco USA',
          description: 'Oilco EMEA Division'
        },
        {
          id: 'SHIPLINE',
          name: 'Shipline',
          description: 'World class shipping'
        },
        {
          id: 'ROOT',
          name: 'Super Admin',
          description: 'Super Admin organization'
        },
        {
          id: 'WONKA',
          name: 'Wonka Inc',
          description: 'Scrumpalicious Chocolate'
        }
      ])

      done()
    })
  })
  lab.test('get organizations list: page1', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.data).to.equal([
        {
          id: 'CONCH',
          name: 'Conch Plc',
          description: 'Global fuel distributors'
        },
        {
          id: 'OILCOEMEA',
          name: 'Oilco EMEA',
          description: 'Oilco EMEA Division'
        },
        {
          id: 'OILCOUSA',
          name: 'Oilco USA',
          description: 'Oilco EMEA Division'
        }
      ])

      done()
    })
  })
  lab.test('get organizations list: page2', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=2'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.data).to.equal([
        {
          id: 'SHIPLINE',
          name: 'Shipline',
          description: 'World class shipping'
        },
        {
          id: 'ROOT',
          name: 'Super Admin',
          description: 'Super Admin organization'
        },
        {
          id: 'WONKA',
          name: 'Wonka Inc',
          description: 'Scrumpalicious Chocolate'
        }
      ])

      done()
    })
  })

  lab.test('get single organization', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations/WONKA'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'WONKA',
        name: 'Wonka Inc',
        description: 'Scrumpalicious Chocolate',
        policies: []
      })

      done()
    })
  })

  lab.test('create organization should return 201 for success', (done) => {
    const organization = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        organization: {
          id: 'nearForm',
          name: 'nearForm',
          description: 'nearForm org',
          policies: []
        },
        user: undefined
      })

      udaru.organizations.delete('nearForm', done)
    })
  })

  lab.test('create organization with no id', (done) => {
    const organization = {
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result.organization

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal(organization.name)
      expect(result.description).to.equal(organization.description)

      udaru.organizations.delete(result.id, done)
    })
  })

  lab.test('create organization with specified but undefined id', (done) => {
    const organization = {
      id: undefined,
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result.organization

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal(organization.name)
      expect(result.description).to.equal(organization.description)

      udaru.organizations.delete(result.id, done)
    })
  })

  lab.test('create organization with null id', (done) => {
    const organization = {
      id: null,
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create organization with empty string id', (done) => {
    const organization = {
      id: '',
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create organization and an admin user should return 201 for success', (done) => {
    const organization = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm org',
      user: {
        id: 'exampleId',
        name: 'example'
      }
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        organization: {
          id: 'nearForm',
          name: 'nearForm',
          description: 'nearForm org',
          policies: []
        },
        user: {
          id: 'exampleId',
          name: 'example'
        }
      })

      udaru.organizations.delete('nearForm', done)
    })
  })

  lab.test('delete organization should return 204 if success', (done) => {
    udaru.organizations.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/organizations/${res.organization.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(204)
        expect(result).to.not.exist()

        done()
      })
    })
  })

  lab.test('update organization should return 200 for success', (done) => {
    udaru.organizations.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
      expect(err).to.not.exist()

      let orgUpdate = {
        id: 'nearForm',
        name: 'new name',
        description: 'new desc'
      }

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/organizations/${orgUpdate.id}`,
        payload: {
          name: orgUpdate.name,
          description: orgUpdate.description
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal({ id: 'nearForm', name: 'new name', description: 'new desc', policies: [] })

        udaru.organizations.delete('nearForm', done)
      })
    })
  })

  lab.test('add policies to an organization', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/organizations/${organizationId}/policies`,
      payload: {
        policies: [testPolicy.id]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.exist()
      expect(result.policies.length).to.equal(1)
      expect(result.policies[0].id).to.equal(testPolicy.id)

      done()
    })
  })

  lab.test('add policies with variables to an organization', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/organizations/${organizationId}/policies`,
      payload: {
        policies: [{
          id: testPolicy.id,
          variables: {var1: 'value1'}
        }]
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.policies).to.exist()
      // it's 2 because the previous tests insert one policy, this inserts the second
      expect(result.policies.length).to.equal(2)
      expect(result.policies).to.include({
        id: testPolicy.id,
        name: testPolicy.name,
        version: testPolicy.version,
        variables: {var1: 'value1'}
      })

      done()
    })
  })

  lab.test('add policy with invalid ID to an organization', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/organizations/WONKA/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('replace the policies of an organization', (done) => {
    udaru.organizations.addPolicies({ id: organizationId, policies: [testPolicy.id] }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'POST',
        url: `/authorization/organizations/${organizationId}/policies`,
        payload: {
          policies: [testPolicy2.id]
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.policies).to.exist()
        expect(result.policies.length).to.equal(1)
        expect(result.policies[0].id).to.equal(testPolicy2.id)

        done()
      })
    })
  })

  lab.test('add policy with invalid ID to an organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations/WONKA/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('delete the policies of an organization', (done) => {
    udaru.organizations.addPolicies({ id: organizationId, policies: [testPolicy.id, testPolicy2.id] }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/organizations/${organizationId}/policies`
      })

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(204)

        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(0)

          done()
        })
      })
    })
  })

  lab.test('delete the policy of an organization', (done) => {
    udaru.organizations.addPolicies({ id: organizationId, policies: [testPolicy.id, testPolicy2.id] }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/organizations/${organizationId}/policies/${testPolicy2.id}`
      })

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(204)

        udaru.organizations.read(organizationId, (err, res) => {
          expect(err).to.not.exist()
          expect(res.policies.length).to.equal(1)
          expect(res.policies[0].id).to.equal(testPolicy.id)

          done()
        })
      })
    })
  })
})
