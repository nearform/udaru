const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const mu = require('mu')()

const TestHelper = require('../helper')
const Authorization = require('../../routes/authorization')

let server

const muStub = {
  outbound: () => {},
  dispatch: () => {}
}

lab.before(function (done) {
  const options = {
    mu: muStub
  }

  server = TestHelper.createTestServer(Authorization, options, done)
})

lab.experiment('Authorization', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, {
          access: true
        })
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/check/resource_a/action_a/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })

  lab.test('check authorization should return access false for denied', (done) => {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, {
          access: false
        })
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/check/resource_a/action_a/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

  lab.test('check authorization should return 500 for error case', (done) => {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(mu.error.badImplementation())
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/check/resource_a/action_a/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionListStub = {
      actions: [
        'action a',
        'action b'
      ]
    }

    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, actionListStub)
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/list/resource_a/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

      done()
    })
  })

  lab.test('list authorizations should return 500 for error case', (done) => {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(mu.error.badImplementation())
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/list/resource_a/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
