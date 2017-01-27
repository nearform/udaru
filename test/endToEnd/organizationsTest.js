'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('./../utils')
const server = require('./../../lib/wiring-hapi')
const { udaru } = utils

lab.experiment('Organizations', () => {
  lab.test('get organizations list has default pagination params', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations'
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(200)
      expect(response.result).to.exist()
      expect(response.result.page).to.equal(1)
      expect(response.result.total).greaterThan(1)
      expect(response.result.limit).greaterThan(1)
      done()
    })
  })

  lab.test('get organizations list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=10&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result
      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(10)
      expect(result.total).to.equal(6)
      expect(result.data).to.equal([
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
  lab.test('get organizations list: page1', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=1'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.data).to.equal([
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
        }
      ])

      done()
    })
  })
  lab.test('get organizations list: page2', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/organizations?limit=3&page=2'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.data).to.equal([
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

      udaru.organizations.delete('nearForm', done)
    })
  })

  lab.test('create organization with no id', (done) => {
    const organization = {
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result.organization

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal(organization.name)
      expect(result.description).to.equal(organization.description)

      udaru.organizations.delete(result.id, done)
    })
  })

  lab.test('create organization with specified but undefined id', (done) => {
    const organization = {
      id: undefined,
      name: 'nearForm',
      description: 'nearForm org'
    }

    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/organizations',
      payload: organization
    })

    server.inject(options, (response) => {
      const result = response.result.organization

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal(organization.name)
      expect(result.description).to.equal(organization.description)

      udaru.organizations.delete(result.id, done)
    })
  })

  lab.test('create organization with null id', (done) => {
    const organization = {
      id: null,
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

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create organization with empty string id', (done) => {
    const organization = {
      id: '',
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

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
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

      udaru.organizations.delete('nearForm', done)
    })
  })

  lab.test('delete organization should return 204 if success', (done) => {
    udaru.organizations.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
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
    udaru.organizations.create({ id: 'nearForm', name: 'nearForm', description: 'nearForm org' }, (err, res) => {
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

        udaru.organizations.delete('nearForm', done)
      })
    })
  })
})
