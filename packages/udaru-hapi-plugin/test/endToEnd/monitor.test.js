'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const serverFactory = require('../test-server')

lab.experiment('monitor', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('calling ping should return 200 Ok', async () => {
    const options = {
      method: 'GET',
      url: '/ping'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
  })
})
