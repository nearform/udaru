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

lab.experiment('Users', () => {
  lab.test('get user list', (done) => {
    let list = [{
      id: 1,
      name: 'John'
    }, {
      id: 2,
      name: 'Jack'
    }]

    nock('http://localhost:8080')
      .get('/authorization/users')
      .reply(200, list)

    const options = {
      method: 'GET',
      url: '/authorization/users'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(list)

      done()
    })
  })

  lab.test('get user list should return error for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/users')
      .reply(500)

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

  lab.test('get single user', (done) => {
    let user = {
      id: 1,
      name: 'John',
      policies: [],
      team: []
    }

    nock('http://localhost:8080')
      .get('/authorization/users/1')
      .reply(200, user)

    const options = {
      method: 'GET',
      url: '/authorization/users/1'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(user)

      done()
    })
  })

  lab.test('get single user should return error for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/users/99')
      .reply(500)

    const options = {
      method: 'GET',
      url: '/authorization/users/99'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('create user should return 201 for success', (done) => {
    const newUserStub = {
      id: 2,
      name: 'Salman',
      policies: [],
      team: []
    }

    nock('http://localhost:8080')
      .post('/authorization/users')
      .reply(201, newUserStub)

    const options = {
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      }
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal(newUserStub)

      done()
    })
  })

  lab.test('create user should return 400 bad request if input validation fails', (done) => {
    nock('http://localhost:8080')
      .post('/authorization/users')
      .reply(400)

    const options = {
      method: 'POST',
      url: '/authorization/users',
      payload: {}
    }

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)

      done()
    })
  })

  lab.test('create user should return error for error case', (done) => {
    nock('http://localhost:8080')
      .post('/authorization/users')
      .reply(500)

    const options = {
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      }
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return 204 if success', (done) => {
    nock('http://localhost:8080')
      .delete('/authorization/users/1')
      .reply(204)

    const options = {
      method: 'DELETE',
      url: '/authorization/users/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(204)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('delete user should return error for error case', (done) => {
    nock('http://localhost:8080')
      .delete('/authorization/users/1')
      .reply(500)

    const options = {
      method: 'DELETE',
      url: '/authorization/users/1'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('update user should return 200 for success', (done) => {
    let user = {
      id: 3,
      name: 'Joe'
    }

    nock('http://localhost:8080')
      .put('/authorization/users/3')
      .reply(200, user)

    const options = {
      method: 'PUT',
      url: '/authorization/users/3',
      payload: {
        name: 'Joe'
      }
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 3,
        name: 'Joe'
      })

      done()
    })
  })

  lab.test('update user should return error for error case', (done) => {
    nock('http://localhost:8080')
      .put('/authorization/users/1')
      .reply(500)

    const options = {
      method: 'PUT',
      url: '/authorization/users/1',
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
