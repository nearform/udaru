'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const server = require('./../../wiring-hapi')

lab.experiment('Authorization', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTtoken/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: true })

      done()
    })
  })

  lab.test('check authorization should return access false for denied', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ModifyToken/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionListStub = {
      actions: []
    }
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/ModifyToken/not/my/resource'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionListStub)

      done()
    })
  })

  // lab.test('list authorizations should return actions allowed for the user', (done) => {
  //   const actionListStub = {
  //     actions: ['Read']
  //   }
  //   const options = utils.requestOptions({
  //     method: 'GET',
  //     url: '/authorization/list/TWFueSBQb2xpY2Vz/myapp/users/filippo'
  //   })

  //   server.inject(options, (response) => {
  //     const result = response.result

  //     console.log(result)

  //     expect(response.statusCode).to.equal(200)
  //     expect(result).to.equal(actionListStub)

  //     done()
  //   })
  // })
})
