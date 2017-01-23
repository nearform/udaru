'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
var utils = require('./../utils')
var policyOps = require('./../../src/lib/ops/policyOps')
var server = require('./../../src/wiring-hapi')

const policyCreateData = {
  version: '2016-07-01',
  name: 'Documents Admin',
  statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}',
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

  lab.test('get single policy', (done) => {
    policyOps.createPolicy(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'GET',
        url: `/authorization/policies/${p.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal(p)

        policyOps.deletePolicy({ id: p.id, organizationId: 'WONKA' }, done)
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
        statements: 'fake-statements'
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
        statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      expect(response.result.message).to.equal('Policy with id policyId1 already present')

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
        statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.name).to.equal('Documents Admin')

      policyOps.deletePolicy({ id: result.id, organizationId: 'WONKA' }, done)
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
        statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.equal('')
      expect(result.name).to.equal('Documents Admin')

      policyOps.deletePolicy({ id: result.id, organizationId: 'WONKA' }, done)
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
        statements: '{"Statement":[{"Effect":"Allow","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('mySpecialPolicyId')
      expect(result.name).to.equal('Documents Admin')

      policyOps.deletePolicy({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('update new policy without a service key should return 403 Forbidden', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/policies/whatever?sig=123',
      payload: {
        version: '2016-07-01',
        name: 'Documents Admin',
        statements: 'fake-statements'
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
    policyOps.createPolicy(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/policies/${p.id}?sig=123456789`,
        payload: {
          version: '1234',
          name: 'new policy name',
          statements: '{"Statement":[{"Effect":"Deny","Action":["documents:Read"],"Resource":["wonka:documents:/public/*"]}]}'
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.name).to.equal('new policy name')
        expect(result.version).to.equal('1234')
        expect(result.statements).to.equal({ Statement: [{ Action: ['documents:Read'], Effect: 'Deny', Resource: ['wonka:documents:/public/*'] }] })

        policyOps.deletePolicy({ id: p.id, organizationId: 'WONKA' }, done)
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
    policyOps.createPolicy(policyCreateData, (err, p) => {
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
})
