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

lab.experiment('Authorization', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/check/1/action_a/resource_a')
      .reply(200, {access: true})

    const options = {
      method: 'GET',
      url: '/authorization/check/1/action_a/resource_a'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })

  lab.test('check authorization should return access false for denied', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/check/1/action_a/resource_a')
      .reply(200, {access: false})

    const options = {
      method: 'GET',
      url: '/authorization/check/1/action_a/resource_a'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

  lab.test('check authorization should return 500 for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/check/action_a/1/resource_a')
      .reply(500)

    const options = {
      method: 'GET',
      url: '/authorization/check/action_a/1/resource_a'
    }

    server.inject(options, (response) => {
      const result = response.result

      // TO-DO: is should return 500
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

    nock('http://localhost:8080')
      .get('/authorization/list/1/resource_a')
      .reply(200, actionListStub)

    const options = {
      method: 'GET',
      url: '/authorization/list/1/resource_a'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

      done()
    })
  })

  lab.test('list authorizations should return 500 for error case', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/list/1/resource_a')
      .reply(500)

    const options = {
      method: 'GET',
      url: '/authorization/list/1/resource_a'
    }

    server.inject(options, (response) => {
      const result = response.result

      // TO-DO: is should return 500
      expect(response.statusCode).to.equal(500)
      expect(result).to.be.undefined

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user when using an URI', (done) => {
    const actionListStub = {
      actions: [
        'action a',
        'action b'
      ]
    }

    nock('http://localhost:8080')
      .get('/authorization/list/1/my/resource/uri')
      .reply(200, actionListStub)

    const options = {
      method: 'GET',
      url: '/authorization/list/1/my/resource/uri'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

      done()
    })
  })

  lab.test('check authorization should return access true for allowed on URI resource', (done) => {
    nock('http://localhost:8080')
      .get('/authorization/check/1/action_a//my/resource/uri')
      .reply(200, { access: true })

    const options = {
      method: 'GET',
      url: '/authorization/check/1/action_a//my/resource/uri'
    }

    server.inject(options, (response) => {
      const result = JSON.parse(response.result)

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })
})
