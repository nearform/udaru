'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const server = require('../test-server')()

lab.experiment('monitor', () => {
  lab.test('calling ping should return 200 Ok', (done) => {
    const options = {
      method: 'GET',
      url: '/ping'
    }

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)

      done()
    })
  })
})
