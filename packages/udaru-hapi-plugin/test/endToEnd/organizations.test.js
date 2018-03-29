'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('@nearform/udaru-core/test/testUtils')
const uuid = require('uuid/v4')
const serverFactory = require('../test-server')
const udaru = require('@nearform/udaru-core')()

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

const metadata = {key1: 'val1', key2: 'val2'}

lab.experiment('Organizations', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()

    await udaru.policies.create(testPolicy)
    await udaru.policies.create(testPolicy2)
  })

  lab.after(async () => {
    try {
      await Promise.all([
        udaru.organizations.deletePolicy({id: organizationId, policyId: testPolicy.id}),
        udaru.organizations.deletePolicy({id: organizationId, policyId: testPolicy2.id})
      ])
    } catch (e) {
      // This is needed to ignore the error (i.e. in case the organizations weren't properly created)
    }
  })

  lab.afterEach(async () => {
    try {
      await Promise.all([
        udaru.organizations.delete('nearForm'),
        udaru.organizations.delete('nearForm_Meta'),
        udaru.organizations.delete('nearForm_Meta2')
      ])
    } catch (e) {
      // This is needed to ignore the error (i.e. in case the organizations weren't properly created)
    }
  })

  lab.test('get organizations list has default pagination params', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.exist()
    expect(response.result.page).to.equal(1)
    expect(response.result.total).greaterThan(1)
    expect(response.result.limit).greaterThan(1)
  })

  lab.test('get organizations list', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=10&page=1'
    })

    const response = await server.inject(options)
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
  })
  lab.test('get organizations list: page1', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=1'
    })

    const response = await server.inject(options)
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
  })
  lab.test('get organizations list: page2', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=2'
    })

    const response = await server.inject(options)
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
  })

  lab.test('get single organization', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations/WONKA'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'WONKA',
      name: 'Wonka Inc',
      description: 'Scrumpalicious Chocolate',
      policies: []
    })
  })

  lab.test('get a single org with meta', async () => {
    await udaru.organizations.create({id: 'nearForm_Meta2', name: 'nearForm Meta2', description: 'nearForm org with Meta2', metadata: metadata})

    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations/nearForm_Meta2'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'nearForm_Meta2',
      name: 'nearForm Meta2',
      description: 'nearForm org with Meta2',
      metadata: metadata,
      policies: []
    })
  })

  lab.test('get single organization with meta', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations/CONCH'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'CONCH',
      name: 'Conch Plc',
      description: 'Global fuel distributors',
      policies: []
    })
  })

  lab.test('create organization should return 201 for success', async () => {
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

    const response = await server.inject(options)
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

    await udaru.organizations.delete('nearForm')
  })

  lab.test('create organization with metadata, return 201 for success', async () => {
    const organization = {
      id: 'nearForm_Meta',
      name: 'nearForm_Meta',
      description: 'nearForm org with meta',
      metadata: metadata
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result).to.equal({
      organization: {
        id: 'nearForm_Meta',
        name: 'nearForm_Meta',
        description: 'nearForm org with meta',
        metadata: metadata,
        policies: []
      },
      user: undefined
    })

    await udaru.organizations.delete('nearForm_Meta')
  })

  lab.test('create organization with no id', async () => {
    const organization = {
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    const response = await server.inject(options)
    const result = response.result.organization

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result.name).to.equal(organization.name)
    expect(result.description).to.equal(organization.description)

    await udaru.organizations.delete(result.id)
  })

  lab.test('create organization with specified but undefined id', async () => {
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

    const response = await server.inject(options)
    const result = response.result.organization

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result.name).to.equal(organization.name)
    expect(result.description).to.equal(organization.description)

    await udaru.organizations.delete(result.id)
  })

  lab.test('create organization with null id', async () => {
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

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('create organization with empty string id', async () => {
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

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('create organization and an admin user should return 201 for success', async () => {
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

    const response = await server.inject(options)
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

    await udaru.organizations.delete('nearForm')
  })

  lab.test('delete organization should return 204 if success', async () => {
    const res = await udaru.organizations.create({id: 'nearForm', name: 'nearForm', description: 'nearForm org'})

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/organizations/${res.organization.id}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(204)
    expect(result).to.not.exist()
  })

  lab.test('update organization should return 200 for success', async () => {
    await udaru.organizations.create({id: 'nearForm', name: 'nearForm', description: 'nearForm org'})

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

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({ id: 'nearForm', name: 'new name', description: 'new desc', policies: [] })

    await udaru.organizations.delete('nearForm')
  })

  lab.test('update organization with metadata should return 200 for success', async () => {
    const res = await udaru.organizations.create({id: 'nearForm_Meta2', name: 'nearForm Meta2', description: 'nearForm org with Meta2'})

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/organizations/${res.organization.id}`,
      payload: {
        name: 'nearForm Meta2',
        description: 'nearForm org with Meta2',
        metadata: metadata
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({ id: 'nearForm_Meta2',
      name: 'nearForm Meta2',
      description: 'nearForm org with Meta2',
      metadata: metadata,
      policies: []
    })
  })

  lab.test('add policies to an organization', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/organizations/${organizationId}/policies`,
      payload: {
        policies: [testPolicy.id]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies).to.exist()
    expect(result.policies.length).to.equal(1)
    expect(result.policies[0].id).to.equal(testPolicy.id)
  })

  lab.test('add policies with variables to an organization', async () => {
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

    const response = await server.inject(options)
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
  })

  lab.test('add policy with invalid ID to an organization', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/organizations/WONKA/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('replace the policies of an organization', async () => {
    await udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id]})

    const options = utils.requestOptions({
      method: 'POST',
      url: `/authorization/organizations/${organizationId}/policies`,
      payload: {
        policies: [testPolicy2.id]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies).to.exist()
    expect(result.policies.length).to.equal(1)
    expect(result.policies[0].id).to.equal(testPolicy2.id)
  })

  lab.test('add policy with invalid ID to an organization', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations/WONKA/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('delete the policies of an organization', async () => {
    await udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id, testPolicy2.id]})

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/organizations/${organizationId}/policies`
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    const res = await udaru.organizations.read(organizationId)
    expect(res.policies.length).to.equal(0)
  })

  lab.test('delete the policy of an organization', async () => {
    await udaru.organizations.addPolicies({id: organizationId, policies: [testPolicy.id, testPolicy2.id]})

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/organizations/${organizationId}/policies/${testPolicy2.id}`
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    const res = await udaru.organizations.read(organizationId)
    expect(res.policies.length).to.equal(1)
    expect(res.policies[0].id).to.equal(testPolicy.id)
  })
})
