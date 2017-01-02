'use strict'

const Joi = require('joi')
const policyOps = require('./../../lib/ops/policyOps')
const Action = require('./../../lib/config/config.auth').Action
const swagger = require('./../../swagger')

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      const { organizationId } = request.udaru

      policyOps.listByOrganization({ organizationId }, reply)
    },
    config: {
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies endpoint returns a list of all the defined policies\nthe policies will contain only the id, version and name, no statements.\n',
      tags: ['api', 'service', 'get', 'policies'],
      plugins: {
        auth: {
          action: Action.ListPolicies
        }
      },
      validate: {
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      response: {schema: swagger.PolicyList}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      policyOps.readPolicy({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('policy id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies/{id} endpoint returns a single policy based on it\'s id.\n',
      tags: ['api', 'service', 'get', 'policies'],
      plugins: {
        auth: {
          action: Action.ReadPolicy,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: {schema: swagger.Policy}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'policies',
  version: '0.0.1'
}
