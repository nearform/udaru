'use strict'

const _ = require('lodash')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('@nearform/udaru-core/lib/ops/validation').policies

exports.register = function (server, options, next) {
  const Action = server.udaruConfig.get('AuthConfig.Action')

  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      request.udaruCore.policies.list({
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
      response: { schema: swagger.PagedPolicies }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      request.udaruCore.policies.read({ id, organizationId }, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.readPolicy, ['id']),
        headers
      },
      description: 'Fetch a single policy by ID',
      notes: 'The GET /authorization/policies/{id} endpoint returns a policy based on its ID.\n',
      tags: ['api', 'policies'],
      plugins: {
        auth: {
          action: Action.ReadPolicy,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: { schema: swagger.Policy }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/policies/{id}/variables',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      request.udaruCore.policies.readPolicyVariables({ id, organizationId, type: 'organization' }, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.readPolicy, ['id']),
        headers
      },
      description: 'Fetch a template policy\'s variables',
      notes: 'The GET /authorization/policies/{id}/variables endpoint returns policy variables based on its ID.\n',
      tags: ['api', 'policies'],
      plugins: {
        auth: {
          action: Action.ReadPolicyVariables,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: { schema: swagger.TemplatePolicyVariables }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/shared-policies/{id}/variables',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const { id } = request.params

      request.udaruCore.policies.readPolicyVariables({ id, organizationId, type: 'shared' }, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.readPolicy, ['id']),
        headers
      },
      description: 'Fetch a template shared policy\'s variables',
      notes: 'The GET /authorization/policies/{id}/variables endpoint returns shared policy variables based on its ID.\n',
      tags: ['api', 'policies'],
      plugins: {
        auth: {
          action: Action.ReadPolicyVariables,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: { schema: swagger.TemplatePolicyVariables }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/shared-policies',
    handler: function (request, reply) {
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      request.udaruCore.policies.listShared({
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
      description: 'Fetch all the defined shared policies',
      notes: 'The GET /authorization/shared-policies endpoint returns a list of all the defined policies\nthe policies will contain only the ID, version and name. No statements.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
      tags: ['api', 'policies'],
      plugins: {
        auth: {
          action: Action.ListPolicies
        }
      },
      validate: {
        headers,
        query: _.pick(validation.listSharedPolicies, ['page', 'limit'])
      },
      response: { schema: swagger.PagedPolicies }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/policies/search',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const query = request.query.query

      request.udaruCore.policies.search({
        organizationId,
        query,
        type: 'organization'
      }, (err, data, total) => {
        reply(
          err,
          err ? null : {
            data,
            total
          }
        )
      })
    },
    config: {
      description: 'Search for organization policies',
      notes: 'The GET /authorization/policies/search endpoint returns a filtered list of policies.\n\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.SearchPolicies
        }
      },
      validate: {
        headers,
        query: _.pick(validation.searchPolicy, ['query'])
      },
      response: { schema: swagger.PagedPolicies }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/shared-policies/search',
    handler: function (request, reply) {
      const { organizationId } = request.udaru
      const query = request.query.query

      request.udaruCore.policies.search({
        organizationId,
        query,
        type: 'shared'
      }, (err, data, total) => {
        reply(
          err,
          err ? null : {
            data,
            total
          }
        )
      })
    },
    config: {
      description: 'Search for shared policies',
      notes: 'The GET /authorization/shared-policies/search endpoint returns a filtered list of shared policies.\n\n',
      tags: ['api', 'teams'],
      plugins: {
        auth: {
          action: Action.SearchPolicies
        }
      },
      validate: {
        headers,
        query: _.pick(validation.searchPolicy, ['query'])
      },
      response: { schema: swagger.PagedPolicies }
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/shared-policies/{id}',
    handler: function (request, reply) {
      const { id } = request.params

      request.udaruCore.policies.readShared({ id }, reply)
    },
    config: {
      validate: {
        params: _.pick(validation.readSharedPolicy, ['id']),
        headers
      },
      description: 'Fetch a single shared policy',
      notes: 'The GET /authorization/shared-policies/{id} endpoint returns a policy based on its ID.\n',
      tags: ['api', 'policies'],
      plugins: {
        auth: {
          action: Action.ReadPolicy,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: { schema: swagger.Policy }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'policies',
  version: '0.0.1'
}
