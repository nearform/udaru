const Hapi = require('hapi')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const TestHelper = require('../helper')
const Policies = require('../../routes/policies')

let server

const muStub = {
  outbound: () => {},
  dispatch: () => {}
}

lab.before(function (done) {
  const options = {
    mu: muStub
  }

  server = TestHelper.createTestServer(Policies, options, done);
});

lab.experiment('Policies', () => {
  lab.test('get policy list', (done) =>  {
    const policyListStub = [{
      id: 1,
      name: 'SysAdmin',
      version: '0.1'
    }, {
      id: 2,
      name: 'Developer',
      version: '0.2'
    }]

    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, policyListStub)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/policies'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(policyListStub)

      done()
    })
  })

  lab.test('get policy list should return 500 on unknown errors', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

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

  lab.test('get single policy', (done) =>  {
    const policyStub = {
      id: 1,
      name: 'SysAdmin',
      version: '0.1',
      statements: [{
        "Statement": [
          {
            "Action": [
              "finance:ReadBalanceSheet"
            ],
            "Effect": "Allow",
            "Resource": [
              "database:pg01:balancesheet"
            ]
          },
          {
            "Action": [
              "finance:ImportBalanceSheet"
            ],
            "Effect": "Deny",
            "Resource": [
              "database:pg01:balancesheet"
            ]
          }
        ]
      }]
    }
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, policyStub)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/policy/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(policyStub)

      done()
    })
  })

  lab.test('get single policy should return 404 for unknown policy', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('not found')
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/policy/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(404)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single policy should return 500 for unknown errors', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/policy/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
