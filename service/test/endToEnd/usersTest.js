'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
var utils = require('./../utils')

var server = require('./../../wiring-hapi')

lab.experiment('Users', () => {

  lab.test('create user for a non existent organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      },
      headers: {
        authorization: 1,
        org: 'DOES_NOT_EXISTS'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.equal({
        error: 'Bad Request',
        message: `Organization 'DOES_NOT_EXISTS' does not exists`,
        statusCode: 400
      })

      done()
    })
  })
})
