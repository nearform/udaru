'use strict'

const _ = require('lodash')
const expect = require('@hapi/code').expect
const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const config = require('../../lib/config')()
const utils = require('@nearform/udaru-core/test/testUtils')
const serverFactory = require('../test-server')
const udaru = require('@nearform/udaru-core')()

const defaultPageSize = config.get('authorization.defaultPageSize')
const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

const policyCreateData = {
  version: '2016-07-01',
  name: 'Documents Admin',
  statements,
  organizationId: 'WONKA'
}

lab.experiment('Users: read - delete - update', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('user list should have default pagination', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).greaterThan(1)
    expect(result.total).to.be.at.least(7)
    expect(result.data.length).to.equal(result.total)
  })

  lab.test('get user list', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?page=1&limit=3'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(7)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(3)
    expect(result.data.length).to.equal(3)
    expect(result.data[0]).to.equal({
      id: 'AugustusId',
      name: 'Augustus Gloop',
      organizationId: 'WONKA'
    })
  })

  lab.test('no users list', async () => {
    const options = {
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOEMEA'
      },
      method: 'GET',
      url: '/authorization/users'
    }

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(defaultPageSize)
    expect(result.total).to.equal(0)
    expect(result.data.length).to.equal(0)
  })

  lab.test('get not existing user', async () => {
    const incorrectId = 'Incorrect_Id'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${incorrectId}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(result.statusCode).to.equal(404)
    expect(result.error).to.equal('Not Found')
    expect(result.message).to.equal(`User ${incorrectId} not found`)
  })

  lab.test('get single user', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/AugustusId'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'AugustusId',
      name: 'Augustus Gloop',
      organizationId: 'WONKA',
      policies: [],
      teams: [
        {
          id: '1',
          name: 'Admins'
        }
      ]
    })
  })

  lab.test('get single user with metadata', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/MikeId'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'MikeId',
      name: 'Mike Teavee',
      organizationId: 'WONKA',
      metadata: { key1: 'val1', key2: 'val2' },
      policies: [],
      teams: []
    })
  })

  lab.test('delete user should return 204 if success', async () => {
    await udaru.users.create({ name: 'test', id: 'testId', organizationId: 'ROOT' })

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/testId',
      headers: {
        authorization: 'ROOTid'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(204)
    expect(result).to.not.exist()
  })

  lab.test('update user should return 200 for success', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId',
      payload: {
        name: 'Modify you'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'ModifyId',
      name: 'Modify you',
      organizationId: 'WONKA',
      teams: [],
      policies: []
    })

    udaru.users.update({ name: 'Modify Me', id: 'ModifyId', organizationId: 'WONKA' })
  })

  lab.test('update user with metadata field and 200ok response', async () => {
    const metadata = { key1: 1, key2: 'y' }
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId',
      payload: {
        name: 'Modify you',
        metadata: metadata
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: 'ModifyId',
      name: 'Modify you',
      organizationId: 'WONKA',
      metadata: metadata,
      teams: [],
      policies: []
    })

    await udaru.users.update({ name: 'Modify Me', id: 'ModifyId', organizationId: 'WONKA' })
  })
})

lab.experiment('Users - create', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.after(async () => {
    try {
      await Promise.all([
        udaru.users.delete({ id: 'testId' }),
        udaru.users.delete({ id: 'testId', organizationId: 'OILCOUSA' })
      ])
    } catch (e) {
      // This is needed to ignore the error (i.e. in case the users weren't properly created)
    }
  })

  lab.test('create user for a non existent organization', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'DOES-NOT-EXISTS'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result).to.equal({
      error: 'Bad Request',
      message: `Organization 'DOES-NOT-EXISTS' does not exist`,
      statusCode: 400
    })
  })

  lab.test('create user for a specific organization being a SuperUser', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.equal('testId')
    expect(result.name).to.equal('Salman')
    expect(result.organizationId).to.equal('OILCOUSA')

    await udaru.users.delete({ id: 'testId', organizationId: 'OILCOUSA' })
  })

  lab.test('create user for a specific organization being a SuperUser with some metadata', async () => {
    const metadata = { key1: 1, key2: 'y' }
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId',
        metadata: metadata
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.equal('testId')
    expect(result.name).to.equal('Salman')
    expect(result.organizationId).to.equal('OILCOUSA')
    expect(result.metadata).to.equal(metadata)

    await udaru.users.delete({ id: 'testId', organizationId: 'OILCOUSA' })
  })

  lab.test('create user for a specific organization being a SuperUser but without specifying the user id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result.name).to.equal('Salman')
    expect(result.organizationId).to.equal('OILCOUSA')

    await udaru.users.delete({ id: result.id, organizationId: 'OILCOUSA' })
  })

  lab.test('create user for a specific organization being a SuperUser with a specified undefined user id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: undefined,
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result.name).to.equal('Salman')
    expect(result.organizationId).to.equal('OILCOUSA')

    await udaru.users.delete({ id: result.id, organizationId: 'OILCOUSA' })
  })

  lab.test('create user for a specific organization being a SuperUser but with specifying empty string user id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: '',
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('create user for a specific organization being a SuperUser but with specifying null user id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: null,
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('create user for a specific organization being a SuperUser with an already used id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: 'ROOTid',
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(409)
    expect(result.message).to.equal('Key (id)=(ROOTid) already exists.')
  })

  lab.test('create user for the admin organization', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'U2FsbWFu'
      },
      headers: {
        authorization: 'ROOTid'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.equal('U2FsbWFu')
    expect(result.name).to.equal('Salman')
    expect(result.organizationId).to.equal('ROOT')

    await udaru.users.delete({ id: result.id, organizationId: 'ROOT' })
  })

  lab.test('create user should return 400 bad request if input validation fails', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {}
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result).to.include({
      statusCode: 400,
      error: 'Bad Request'
    })
  })
})

lab.experiment('Users - manage policies', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('add policies to a user', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: p.id}]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies[0].id).to.equal(p.id)

    await udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' })
    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('add policies with variables to a user', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{
          id: p.id,
          variables: { var1: 'value1' }
        }]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies[0].id).to.equal(p.id)
    expect(result.policies[0].variables).to.equal({ var1: 'value1' })

    await udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' })
    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('Policy instance addition, editing and removal', async () => {
    let options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/VerucaId/policies',
      payload: {policies: []}
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(0)

    options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/VerucaId/policies',
      payload: {
        policies: [{
          id: 'policyId2',
          variables: {var1: 'value1'}
        }]
      }
    })

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
    ])

    const firstInstance = result.policies[0].instance

    options.payload = {
      policies: [{
        id: 'policyId2',
        variables: {var1: 'valueX'},
        instance: firstInstance
      }, {
        id: 'policyId2',
        variables: {var2: 'value2'}
      }, {
        id: 'policyId2',
        variables: {var3: 'value3'}
      }]
    }

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(3)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'valueX'} },
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var2: 'value2'} },
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var3: 'value3'} }
    ])

    options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/users/VerucaId/policies/policyId2?instance=${firstInstance}`
    })

    response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/VerucaId`
    })

    response = await server.inject(options)
    result = response.result
    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(2)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.not.contain([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
    ])

    options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/users/VerucaId/policies/policyId2`
    })

    response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/VerucaId`
    })

    response = await server.inject(options)
    result = response.result
    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(0)

    await udaru.users.replacePolicies({ id: result.id, policies: [{id: 'policyId2'}], organizationId: result.organizationId })
  })

  lab.test('List user policies', async () => {
    let options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/VerucaId/policies',
      payload: {policies: [{
        id: 'policyId2',
        variables: {var1: 'value1'}
      }, {
        id: 'policyId2',
        variables: {var2: 'value2'}
      }, {
        id: 'policyId2',
        variables: {var3: 'value3'}
      }]}
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(3)

    options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/VerucaId/policies'
    })

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(3)
    expect(utils.PoliciesWithoutInstance(result.data)).to.contain([{
      id: 'policyId2',
      name: 'Accountant',
      version: '0.1',
      variables: {var1: 'value1'}
    }])

    options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/VerucaId/policies?limit=100&page=1'
    })

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(3)
    expect(utils.PoliciesWithoutInstance(result.data)).to.contain([ {
      id: 'policyId2',
      name: 'Accountant',
      version: '0.1',
      variables: {var2: 'value2'}
    }])

    await udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: 'policyId2'}], organizationId: 'WONKA' })
  })

  lab.test('get non existent users policies', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/doesnotexist/policies?limit=100&page=1'
    })

    let response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
  })

  lab.test('add policy with invalid ID to a user', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: 'InvalidPolicyID'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('replace policies with a policy with invalid ID should return an error', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: 'InvalidPolicyID'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('clear and replace policies for a user', async () => {
    const p = await udaru.policies.create(policyCreateData)

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: p.id}]
      }
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(1)
    expect(result.policies[0].id).to.equal(p.id)

    const newP = await udaru.policies.create(policyCreateData)

    options.payload.policies = [{id: newP.id}]

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(1)
    expect(result.policies[0].id).to.equal(newP.id)

    await udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' })
    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
    await udaru.policies.delete({ id: newP.id, organizationId: 'WONKA' })
  })

  lab.test('remove all user\'s policies', async () => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/ModifyId/policies'
    })

    const p = await udaru.policies.create(policyCreateData)

    await udaru.users.addPolicies({ id: 'ModifyId', organizationId: 'WONKA', policies: [{id: p.id}] })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    const user = await udaru.users.read({ id: 'ModifyId', organizationId: 'WONKA' })
    expect(user.policies).to.equal([])

    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })

  lab.test('remove one user\'s policies', async () => {
    const p = await udaru.policies.create(policyCreateData)

    await udaru.users.addPolicies({ id: 'ModifyId', organizationId: 'WONKA', policies: [{id: p.id}] })

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/users/ModifyId/policies/${p.id}`
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    await udaru.users.read({ id: 'ModifyId', organizationId: 'WONKA' })
    await udaru.policies.delete({ id: p.id, organizationId: 'WONKA' })
  })
})

lab.experiment('Users - checking org_id scoping', () => {
  let policyId
  let server = null

  lab.before(async () => {
    server = await serverFactory()

    await udaru.organizations.create({ id: 'NEWORG', name: 'new org', description: 'new org' })

    const policyData = {
      version: '1',
      name: 'Documents Admin',
      organizationId: 'NEWORG',
      statements
    }

    const policy = await udaru.policies.create(policyData)

    policyId = policy.id
  })

  lab.afterEach(async () => {
    try {
      await udaru.organizations.delete('NEWORG')
    } catch (e) {
      // This is needed to ignore the error (i.e. in case the organization wasn't properly created)
    }
  })

  lab.test('add policies from a different organization should not be allowed', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: policyId}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('replace policies from a different organization should not be allowed', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [{id: policyId}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })
})

lab.experiment('Users - manage teams', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('get user teams', async () => {
    const userId = 'VerucaId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(2)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(defaultPageSize)
    expect(result.data.length).to.equal(2)
    let expectedTeams = [
      'Authors',
      'Readers'
    ]
    expect(_.map(result.data, 'name')).to.only.contain(expectedTeams)
  })

  lab.test('get user teams, invalid userId', async () => {
    const userId = 'invalidid'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(result.statusCode).to.equal(404)
    expect(result.data).to.not.exist()
    expect(result.total).to.not.exist()
    expect(result.error).to.exist()
    expect(result.message).to.exist()
    expect(result.message.toLowerCase()).to.include(userId).include('not').include('found')
  })

  lab.test('get user teams, user in no teams', async () => {
    const userId = 'ModifyId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(0)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(defaultPageSize)
    expect(result.data.length).to.equal(0)
  })

  lab.test('get user teams, paginated', async () => {
    const userId = 'VerucaId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams?page=2&limit=1`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(2)
    expect(result.page).to.equal(2)
    expect(result.limit).to.equal(1)
    expect(result.data.length).to.equal(1)
    let expectedTeams = [
      'Readers'
    ]
    expect(_.map(result.data, 'name')).contains(expectedTeams)
  })

  lab.test('replace users teams', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/teams',
      payload: {
        teams: ['2', '3']
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal('ModifyId')
    expect(result.teams).to.equal([{ id: '3', name: 'Authors' }, { id: '2', name: 'Readers' }])

    await udaru.users.deleteTeams({ id: result.id, organizationId: result.organizationId, teams: [] })
  })

  lab.test('replace users teams for non-existent user', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/xyz/teams',
      payload: {
        teams: ['2', '3']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
    expect(response.result.message).to.equal('User xyz not found')
  })

  lab.test('replace users teams for non-existent user (bad format)', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/xyz/teams',
      payload: ['1']
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
    expect(response.result.message).to.equal('No teams found in payload')
  })

  lab.test('replace users teams (bad teams format)', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/xyz/teams',
      payload: {
        teams: {}
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
    expect(response.result.message).to.equal('No teams found in payload')
  })

  lab.test('Delete user from her teams', async () => {
    udaru.users.replaceTeams({ id: 'ModifyId', organizationId: 'WONKA', teams: ['2', '3'] })

    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/ModifyId/teams'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal('ModifyId')
    expect(result.teams).to.equal([])
  })
})

lab.experiment('Users - search for user', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test(`search with empty query`, async () => {
    const query = ''
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.exist()
    expect(result.validation).to.exist()
    expect(result.error.toLowerCase()).to.include('bad').include('request')
  })

  lab.test(`search with query value 'm'`, async () => {
    const query = 'm'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result
    const expectedUsers = [
      'Many Polices',
      'Mike Teavee',
      'Modify Me'
    ]

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(3)
    expect(result.data.length).to.equal(3)

    expect(_.map(result.data, 'name')).to.only.contain(expectedUsers)
    expect(result.data.every(d => d.organizationId === 'WONKA')).to.be.true()
  })

  lab.test(`search with query value 'IDONTEXIST'`, async () => {
    const query = 'IDONTEXIST'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.total).to.equal(0)
    expect(result.data.length).to.equal(0)
  })
})
