'use strict'

const _ = require('lodash')
const { expect } = require('code')
const udaru = require('@nearform/udaru-core')()
const utils = require('@nearform/udaru-core/test/testUtils')

function Policy (Statement) {
  return {
    version: '2016-07-01',
    name: 'Test Policy',
    statements: {
      Statement: Statement || [{
        Effect: 'Allow',
        Action: ['dummy'],
        Resource: ['dummy']
      }]
    }
  }
}

function BuildFor (lab, records) {
  return new TestBuilder(lab, records)
}

class TestBuilder {
  constructor (lab, records) {
    this.lab = lab
    this.records = records
  }

  endpoint (endpointData) {
    this.endpointData = endpointData
    return this
  }

  server (serverInstance) {
    this.serverInstance = serverInstance
    return this
  }

  test (description) {
    const test = new CustomTest(this)
    test.test(description)
    return test
  }

  async startServer () {
    if (typeof this.serverInstance !== 'function') return
    this.serverInstance = await this.serverInstance()
  }
}

function interpolate (value, data) {
  function interpolator (value) {
    return interpolate(value, data)
  }

  if (_.isArray(value)) {
    return _.map(value, interpolator)
  }

  if (_.isObject(value)) {
    return _.mapValues(value, interpolator)
  }

  if (!_.isString(value)) {
    return value
  }

  return value.replace(/\{\{(.+?)\}\}/, (match, key) => {
    return _.get(data, key, match)
  })
}

class CustomTest {
  constructor (builder) {
    this.builder = builder
  }

  test (description) {
    this.description = description
    return this
  }

  withPolicy (statement) {
    this.statement = statement
    return this
  }

  endpoint (endpointData) {
    this.endpointData = endpointData
    return this
  }

  shouldRespond (statusCode) {
    this.statusCode = statusCode
    this.build()
    return this
  }

  skip () {
    this._skip = true
    return this
  }

  build () {
    let test = this.builder.lab.test
    if (this._skip) {
      test = this.builder.lab.test.skip
    }

    test(this.description, async () => {
      await this.builder.startServer()

      const { records, serverInstance, endpointData: parentEndpointData } = this.builder
      const { statusCode, endpointData: childEndpointData, statement } = this
      const endpointData = childEndpointData || parentEndpointData
      const testedPolicy = records.testedPolicy

      const policyData = Policy(interpolate(statement, records))
      policyData.id = testedPolicy.id
      policyData.organizationId = testedPolicy.organizationId || 'WONKA'

      await udaru.policies.update(policyData)
      const options = utils.requestOptions(interpolate(endpointData, records))
      const response = await serverInstance.inject(options)
      expect(response.statusCode).to.equal(statusCode)
    })
  }
}

module.exports = { BuildFor, udaru }
