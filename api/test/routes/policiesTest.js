'use strict'

const nock = require('nock')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const initServer = require('../../initServer')

let server

lab.before(function (done) {
  initServer(function (s) {
    server = s
    done()
  })
})

lab.experiment('Policies', () => {
  lab.test('get policy list', (done) => {
    const policyListStub = [{
      id: 1,
      name: 'SysAdmin',
      version: '0.1'
    }, {
      id: 2,
      name: 'Developer',
      version: '0.2'
    }]

    nock('http://localhost:8080')
      .get('/authorization/policies')
      .reply(200, policyListStub)

    const options = {
      method: 'GET',
      url: '/authorization/policies'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(policyListStub)

      done()
    })
  })

  lab.test('get policy list should return error for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/policies')
      .reply(500)

    const options = {
      method: 'GET',
      url: '/authorization/policies'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single policy', (done) => {
    const policyStub = {
      id: 1,
      name: 'SysAdmin',
      version: '0.1',
      statements: [{
        'Statement': [
          {
            'Action': [
              'finance:ReadBalanceSheet'
            ],
            'Effect': 'Allow',
            'Resource': [
              'database:pg01:balancesheet'
            ]
          },
          {
            'Action': [
              'finance:ImportBalanceSheet'
            ],
            'Effect': 'Deny',
            'Resource': [
              'database:pg01:balancesheet'
            ]
          }
        ]
      }]
    }

    nock('http://localhost:8080')
      .get('/authorization/policies/1')
      .reply(200, policyStub)

    const options = {
      method: 'GET',
      url: '/authorization/policies/1'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(policyStub)

      done()
    })
  })

  lab.test('get single policy should return error for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/policies/99')
      .reply(500)

    const options = {
      method: 'GET',
      url: '/authorization/policies/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
