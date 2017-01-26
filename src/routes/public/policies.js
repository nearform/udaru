'use strict'

const Joi = require('joi')
const policyOps = require('./../../lib/ops/policyOps')
const Action = require('./../../lib/config/config.auth').Action
const conf = require('./../../lib/config')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      policyOps.listByOrganization({
        organizationId,
        limit: limit,
        page: page
      }, (err, data, total) => {
        reply(
          err,
          !data ? null : {
            page: page,
            limit: limit,
            total: total,
            data: data
          }
        )
      })
    },
    config: {
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies endpoint returns a list of all the defined policies\nthe policies will contain only the ID, version and name. No statements.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'service', 'get', 'policies'],
      plugins: {
        auth: {
          action: Action.ListPolicies
        }
      },
      validate: {
        headers,
        query: Joi.object({
          page: Joi.number().integer().min(1).description('Page number, starts from 1'),
          limit: Joi.number().integer().min(1).description('Items per page')
        }).required()
      },
      response: {schema: swagger.List(swagger.Policy).label('PagedPolicies')}
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
          id: Joi.string().required().description('Policy ID')
        },
        headers
      },
      description: 'Fetch all the defined policies',
      notes: 'The GET /authorization/policies/{id} endpoint returns a policy based on its ID.\n',
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
