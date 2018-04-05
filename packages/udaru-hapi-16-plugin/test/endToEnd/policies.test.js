'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../../udaru-core/test/testUtils')
const sinon = require('sinon')
const server = require('../test-server')()
const udaru = require('@nearform/udaru-core')()
const Factory = require('../../../udaru-core/test/factory')

const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }
const policyCreateData = {
  version: '2016-07-01',
  name: 'Documents Admin',
  statements,
  organizationId: 'WONKA'
}

lab.experiment('Policies - get/list', () => {
  lab.test('get policy list has default pagination params', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.page).to.equal(1)
      expect(response.result.limit).greaterThan(1)
      done()
    })
  })

  lab.test('search policies', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies/search?query=acc'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.total).to.equal(2)
      done()
    })
  })

  lab.test('search shared policies', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies/search?query=pol'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.total).to.equal(2)
      done()
    })
  })

  lab.test('get policy list: limit', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies?limit=4&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).greaterThan(4)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(4)
      expect(result.data.length).to.equal(4)

      done()
    })
  })

  lab.test('get policy list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies?limit=500&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).lessThan(result.limit) // Will fail if we need to increase limit
      let accountantPolicy = _.find(result.data, {id: 'policyId2'})
      expect(accountantPolicy).to.equal({
        id: 'policyId2',
        version: '0.1',
        name: 'Accountant',
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['finance:ReadBalanceSheet'],
              Resource: ['database:pg01:balancesheet']
            },
            {
              Effect: 'Deny',
              Action: ['finance:ImportBalanceSheet'],
              Resource: ['database:pg01:balancesheet']
            },
            {
              Effect: 'Deny',
              Action: ['finance:ReadCompanies'],
              Resource: ['database:pg01:companies']
            },
            {
              Effect: 'Deny',
              Action: ['finance:UpdateCompanies'],
              Resource: ['database:pg01:companies']
            },
            {
              Effect: 'Deny',
              Action: ['finance:DeleteCompanies'],
              Resource: ['database:pg01:companies']
            }
          ]
        }
      })

      done()
    })
  })

  lab.test('get policy list: error handling', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/policies?limit=500&page=1'
    })

    const stub = sinon.stub(server.udaru.policies, 'list').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
      done()
    })
  })

  lab.test('get single policy', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/policies/${p.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal(p)

        udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
      })
    })
  })
})

lab.experiment('Policies - create/update/delete (need service key)', () => {
  lab.test('create new policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=1234',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('create new policy without valid data should return 400 Bad Request', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('create new policy with already present id should return 400 Bad Request', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        id: 'policyId1',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(409)
      expect(response.result.message).to.equal('policy already exists')

      done()
    })
  })

  lab.test('create new policy should return 201 and the created policy data', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.name).to.equal('Documents Admin')
      expect(result.statements).to.equal(statements)

      udaru.policies.delete({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create new policy with invalid effect data - should return a 400', (done) => {
    const badStatement = { Statement: [{ Effect: 'Groot', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        id: 'badPolicy',
        version: '2016-07-01',
        name: 'Documents Admin',
        badStatement
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('create new policy should allow empty string as id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        id: '',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.equal('')
      expect(result.name).to.equal('Documents Admin')

      udaru.policies.delete({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create new policy specifying an id should return 201 and the created policy data', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/policies?sig=123456789',
      payload: {
        id: 'mySpecialPolicyId',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('mySpecialPolicyId')
      expect(result.name).to.equal('Documents Admin')

      udaru.policies.delete({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('update new policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/policies/whatever?sig=123',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('update policy without valid data should return 400 Bad Request', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/policies/whatever?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('update new policy should return the updated policy data', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/policies/${p.id}?sig=123456789`,
        payload: {
          version: '1234',
          name: 'new policy name',
          statements: {
            Statement: [
              {
                Effect: 'Deny',
                Action: ['documents:Read'],
                Resource: ['wonka:documents:/public/*']
              }
            ]
          }
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.name).to.equal('new policy name')
        expect(result.version).to.equal('1234')
        expect(result.statements).to.equal({ Statement: [{ Action: ['documents:Read'], Effect: 'Deny', Resource: ['wonka:documents:/public/*'] }] })

        udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('delete policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/policies/policyId1?sig=1234'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('delete policy should return 204', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/policies/${p.id}?sig=123456789`
      })

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(204)

        done()
      })
    })
  })

  lab.test('delete policy should return 500 when server errors happen', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/policies/${p.id}?sig=123456789`
      })

      const stub = sinon.stub(server.udaru.policies, 'delete').yields(new Error('ERROR'))

      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        done()
      })
    })
  })
})

lab.experiment('Shared Policies - create/update/delete (need service key)', () => {
  const sharedPolicyCreateData = {
    version: '2016-07-01',
    name: 'Documents Admin',
    statements
  }

  lab.test('create new shared policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=1234',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('create new shared policy without valid data should return 400 Bad Request', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('create new shared policy with already present id should return 409 conflict', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=123456789',
      payload: {
        id: 'policyId1',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(409)
      expect(response.result.message).to.equal('policy already exists')

      done()
    })
  })

  lab.test('create new shared policy should return 201 and the created policy data', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.name).to.equal('Documents Admin')
      expect(result.statements).to.equal(statements)

      udaru.policies.deleteShared({ id: result.id }, done)
    })
  })

  lab.test('create new shared policy should allow empty string as id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=123456789',
      payload: {
        id: '',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.equal('')
      expect(result.name).to.equal('Documents Admin')

      udaru.policies.deleteShared({ id: result.id }, done)
    })
  })

  lab.test('create new shared policy specifying an id should return 201 and the created policy data', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/shared-policies?sig=123456789',
      payload: {
        id: 'mySpecialPolicyId',
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('mySpecialPolicyId')
      expect(result.name).to.equal('Documents Admin')

      udaru.policies.deleteShared({ id: result.id }, done)
    })
  })

  lab.test('update shared policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/shared-policies/whatever?sig=123',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('update shared policy without valid data should return 400 Bad Request', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/shared-policies/whatever?sig=123456789',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('update shared policy should return the updated policy data', (done) => {
    udaru.policies.createShared(sharedPolicyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/shared-policies/${p.id}?sig=123456789`,
        payload: {
          version: '1234',
          name: 'new policy name',
          statements: {
            Statement: [
              {
                Effect: 'Deny',
                Action: ['documents:Read'],
                Resource: ['wonka:documents:/public/*']
              }
            ]
          }
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.name).to.equal('new policy name')
        expect(result.version).to.equal('1234')
        expect(result.statements).to.equal({ Statement: [{ Action: ['documents:Read'], Effect: 'Deny', Resource: ['wonka:documents:/public/*'] }] })

        udaru.policies.deleteShared({ id: p.id }, done)
      })
    })
  })

  lab.test('delete shared policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/shared-policies/policyId1?sig=1234'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(403)

      done()
    })
  })

  lab.test('delete shared policy should return 204', (done) => {
    udaru.policies.createShared(sharedPolicyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/shared-policies/${p.id}?sig=123456789`
      })

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(204)

        done()
      })
    })
  })

  lab.test('delete shared policy should return 500 when server errors happen', (done) => {
    udaru.policies.createShared(sharedPolicyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/shared-policies/${p.id}?sig=123456789`
      })

      const stub = sinon.stub(server.udaru.policies, 'deleteShared').yields(new Error('ERROR'))

      server.inject(options, (response) => {
        stub.restore()

        expect(response.statusCode).to.equal(500)
        done()
      })
    })
  })
})

lab.experiment('Shared policies - get/list', () => {
  const sharedPolicyCreateData = {
    id: 'sharedPolicyTestX',
    version: '2016-07-01',
    name: 'Documents Admin',
    statements
  }

  lab.before(done => {
    udaru.policies.createShared(sharedPolicyCreateData, done)
  })

  lab.after(done => {
    udaru.policies.deleteShared({id: sharedPolicyCreateData.id}, done)
  })

  lab.test('get policy list has default pagination params', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result.page).to.equal(1)
      expect(response.result.limit).greaterThan(1)
      done()
    })
  })

  lab.test('get policy list: limit', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies?limit=1&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).greaterThan(1)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(1)
      expect(result.data.length).to.equal(1)

      done()
    })
  })

  lab.test('get policy list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies?limit=500&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).lessThan(result.limit) // Will fail if we need to increase limit
      let accountantPolicy = _.find(result.data, {id: 'sharedPolicyId1'})
      expect(accountantPolicy).to.equal({
        id: 'sharedPolicyId1',
        version: '0.1',
        name: 'Shared policy from fixtures',
        statements: {
          Statement: [{
            Effect: 'Allow',
            Action: ['Read'],
            Resource: ['/myapp/documents/*']
          }]
        }
      })

      done()
    })
  })

  lab.test('get policy list: error handling', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies?limit=500&page=1'
    })

    const stub = sinon.stub(server.udaru.policies, 'listShared').yields(new Error('ERROR'))

    server.inject(options, (response) => {
      stub.restore()

      expect(response.statusCode).to.equal(500)
      done()
    })
  })

  lab.test('get single policy', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/shared-policies/sharedPolicyTestX'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(sharedPolicyCreateData)

      done()
    })
  })
})

lab.experiment('Policies - variables', () => {
  Factory(lab, {
    organizations: {
      org1: {
        id: 'org1',
        name: 'Test Organization',
        description: 'Test Organization',
        policies: ['pol1']
      }
    },
    users: {
      user1: {
        id: 'user1',
        name: 'Test User1',
        organizationId: 'org1'
      }
    },
    policies: {
      pol1: {
        id: 'pol1',
        name: 'Policy',
        organizationId: 'org1',
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['$' + '{var1}', '$' + '{var2}', '$' + '{var3}']
            }
          ]
        }
      }
    },
    sharedPolicies: {
      spol1: {
        id: 'spol1',
        name: 'Shared Policy',
        organizationId: 'org1',
        statements: {
          Statement: [
            {
              Effect: 'Allow',
              Action: ['read'],
              Resource: ['$' + '{varA}', '$' + '{varB}', '$' + '{udaru.userId}', '$' + '{request.x}']
            }
          ]
        }
      }
    }
  }, udaru)

  lab.test('Correct policy variables returned', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/policies/pol1/variables`,
      headers: {
        authorization: 'ROOTid',
        org: 'org1'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.length).to.equal(3)
      expect(result).to.contain('$' + '{var1}')
      expect(result).to.contain('$' + '{var2}')
      expect(result).to.contain('$' + '{var3}')

      done()
    })
  })

  lab.test('Correct shared policy variables returned', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/shared-policies/spol1/variables`,
      headers: {
        authorization: 'ROOTid',
        org: 'org1'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.length).to.equal(2)
      expect(result).to.contain('$' + '{varA}')
      expect(result).to.contain('$' + '{varB}')
      done()
    })
  })
})
