const Hapi = require('hapi')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const TestHelper = require('../helper')
const Users = require('../../routes/users')

let server

const muStub = {
  outbound: () => {},
  dispatch: () => {}
}

lab.before(function (done) {
  const options = {
    mu: muStub
  }

  server = TestHelper.createTestServer(Users, options, done);
});

lab.experiment('Users', () => {
  lab.test('get user list', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, [{
          id: 1,
          name: 'John'
        }, {
          id: 2,
          name: 'Jack'
        }])
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/users'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal([{
        id: 1,
        name: 'John'
      }, {
        id: 2,
        name: 'Jack'
      }])

      done()
    })
  })

  lab.test('get user list should return 500 on unknown errors', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/users'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single user', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, {
          id: 1,
          name: 'John',
          policies: [],
          team: []
        })
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/user/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 1,
        name: 'John',
        policies: [],
        team: []
      })

      done()
    })
  })

  lab.test('get single user should return 404 for unknown user', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('not found')
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/user/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(404)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single user should return 500 for unknown error', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

    const options = {
      method: 'GET',
      url: '/authorization/user/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('get single user should return 500 for unknown error', (done) =>  {
    const newUserStub = {
      id: 2,
      name: 'Salman',
      policies: [],
      team: []
    }

    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, newUserStub)
      })
    }

    const options = {
      method: 'POST',
      url: '/authorization/user',
      payload: {
        name: 'Salman'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(newUserStub)

      done()
    })
  })

  lab.test('get single user should return 400 bad request if input validation fails', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb()
      })
    }

    const options = {
      method: 'POST',
      url: '/authorization/user',
      payload: {

      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.equal({
        statusCode: 400,
        error: 'Bad Request'
      })

      done()
    })
  })

  lab.test('delete user should return 204 if success', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb()
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/user/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return 500 for unknown errors', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/user/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return 404 for unknown user', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('not found')
      })
    }

    const options = {
      method: 'DELETE',
      url: '/authorization/user/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(404)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update user should return 200 for success', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb(null, {
          id: 3,
          name: 'Joe'
        })
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/user/3',
      payload: {
        name: 'Joe'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 3,
        name: 'Joe'
      })

      done()
    })
  })

  lab.test('update user should return 404 for unknown user', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('not found')
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/user/99',
      payload: {
        name: 'Joe'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(404)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update user should return 500 for unknown error', (done) =>  {
    muStub.dispatch = function (pattern, cb) {
      process.nextTick(() => {
        cb('some weird error')
      })
    }

    const options = {
      method: 'PUT',
      url: '/authorization/user/1',
      payload: {
        name: 'Joe'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })
})
