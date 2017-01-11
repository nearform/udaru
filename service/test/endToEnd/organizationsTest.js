'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
var utils = require('./../utils')
var organizationOps = require('./../../lib/ops/organizationOps')

var server = require('./../../wiring-hapi')

lab.experiment('Organizations', () => {
  lab.test('get organizations list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal([
        {
          id: 'CONCH',
          name: 'Conch Plc',
          description: 'Global fuel distributors'
        },
        {
          id: 'OILCOEMEA',
          name: 'Oilco EMEA',
          description: 'Oilco EMEA Division'
        },
        {
          id: 'OILCOUSA',
          name: 'Oilco USA',
          description: 'Oilco EMEA Division'
        },
        {
          id: 'SHIPLINE',
          name: 'Shipline',
          description: 'World class shipping'
        },
        {
          id: 'ROOT',
          name: 'Super Admin',
          description: 'Super Admin organization'
        },
        {
          id: 'WONKA',
          name: 'Wonka Inc',
          description: 'Scrumpalicious Chocolate'
        }
      ])

      done()
    })
  })

  lab.test('get single organization', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations/WONKA'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'WONKA',
        name: 'Wonka Inc',
        description: 'Scrumpalicious Chocolate'
      })

      done()
    })
  })

  lab.test('create organization should return 201 for success', (done) => {
    const organization = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        organization: {
          id: 'nearForm',
          name: 'nearForm',
          description: 'nearForm org'
        },
        user: undefined
      })

      organizationOps.deleteById('nearForm', done)
    })
  })

  lab.test('create organization and an admin user should return 201 for success', (done) => {
    const organization = {
      id: 'nearForm',
      name: 'nearForm',
      description: 'nearForm org',
      user: {
        id: 'exampleId',
        name: 'example'
      }
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result).to.equal({
        organization: {
          id: 'nearForm',
          name: 'nearForm',
          description: 'nearForm org'
        },
        user: {
          id: 'exampleId',
          name: 'example'
        }
      })

      organizationOps.deleteById('nearForm', done)
    })
  })

  lab.test('delete organization should return 204 if success', (done) => {
    organizationOps.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: `/authorization/organizations/${res.organization.id}`
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(204)
        expect(result).to.be.undefined

        done()
      })
    })
  })

  lab.test('update organization should return 200 for success', (done) => {
    organizationOps.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
      expect(err).to.not.exist()

      let orgUpdate = {
        id: 'nearForm',
        name: 'new name',
        description: 'new desc'
      }

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/organizations/${orgUpdate.id}`,
        payload: {
          name: orgUpdate.name,
          description: orgUpdate.description
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result).to.equal({ id: 'nearForm', name: 'new name', description: 'new desc' })

        organizationOps.deleteById('nearForm', done)
      })
    })
  })
})
