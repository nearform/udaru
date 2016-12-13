'use strict'

const Joi = require('joi')
const PolicyOps = require('./../../lib/policyOps')

exports.register = function (server, options, next) {
  const policyOps = PolicyOps(options.dbPool)

  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      policyOps.listByOrganization({organizationId: request.authorization.organization.id}, reply)
    },
    config: {
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies endpoint returns a list of all the defined policies\nthe policies will contain only the id, version and name, no statements.\n',
      tags: [ 'api', 'service', 'get', 'policies' ]
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      policyOps.readPolicyById(request.params.id, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('policy id')
        }
      },
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies/{id} endpoint returns a single policy based on it\'s id.\n',
      tags: [ 'api', 'service', 'get', 'policies' ]
    }
  })

  next()
}

exports.register.attributes = {
  name: 'policies',
  version: '0.0.1'
}
