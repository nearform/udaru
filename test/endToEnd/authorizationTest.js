'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const server = require('./../../src/wiring-hapi')

lab.experiment('Authorization', () => {
  lab.test('check authorization should return access true for allowed', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/access/ROOTid/action_a/resource_a'
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
      url: '/authorization/access/Modifyid/action_a/resource_a'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({ access: false })

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionList = {
      actions: []
    }
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/list/ModifyId/not/my/resource'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionList)

      done()
    })
  })

  lab.test('list authorizations should return actions allowed for the user', (done) => {
    const actionList = {
      actions: ['Read']
    }
    const options = utils.requestOptions({
      method: 'GET',
      // TO BE DISCUSSED: We need double slashes "//" if we use a "/" at the beginning of a resource in the policies
      // @see https://github.com/nearform/labs-authorization/issues/198
      url: '/authorization/list/ManyPoliciesId//myapp/users/filippo'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal(actionList)

      done()
    })
  })
})
