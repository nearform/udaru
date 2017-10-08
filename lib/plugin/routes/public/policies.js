'use strict'

const _ = require('lodash')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('../../../core/lib/ops/validation').policies

function buildPolicies (udaru, config) {
  function register (server, options, next) {
    const Action = config.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/policies',
      handler: function (request, reply) {
        const { organizationId } = request.udaru
        const limit = request.query.limit || config.get('authorization.defaultPageSize')
        const page = request.query.page || 1
        udaru.policies.list({
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
        tags: ['api', 'policies'],
        plugins: {
          auth: {
            action: Action.ListPolicies
          }
        },
        validate: {
          headers,
          query: _.pick(validation.listByOrganization, ['page', 'limit'])
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

        udaru.policies.read({ id, organizationId }, reply)
      },
      config: {
        validate: {
          params: _.pick(validation.readPolicy, ['id']),
          headers
        },
        description: 'Fetch all the defined policies',
        notes: 'The GET /authorization/policies/{id} endpoint returns a policy based on its ID.\n',
        tags: ['api', 'policies'],
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

  register.attributes = {
    name: 'policies',
    version: '0.0.1'
  }

  return register
}

module.exports = buildPolicies
