'use strict'

const Joi = require('joi')
const Boom = require('boom')
const pick = require('lodash/pick')
const validation = require('@nearform/udaru-core/lib/ops/validation').policies
const swagger = require('../swagger')
const headers = require('../headers')

module.exports = {
  name: 'policies',
  version: '0.0.1',
  register (server, options) {
    const hasValidServiceKey = server.udaruAuthorization.hasValidServiceKey
    const Action = server.udaruConfig.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/policies',
      async handler (request) {
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        return { page, limit, ...(await request.udaruCore.policies.list({ organizationId, limit, page })) }
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
          query: pick(validation.listByOrganization, ['page', 'limit'])
        },
        response: { schema: swagger.PagedPolicies }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/policies/{id}',
      async handler (request) {
        const { organizationId } = request.udaru
        const { id } = request.params

        return request.udaruCore.policies.read({ id, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.readPolicy, ['id']),
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
      method: 'POST',
      path: '/authorization/policies',
      async handler (request, h) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        const { id, version, name, statements } = request.payload
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.policies.create({ id, version, name, organizationId, statements })).code(201)
      },
      config: {
        validate: {
          payload: Joi.object(pick(validation.createPolicy, ['id', 'name', 'version', 'statements'])).label('CreatePolicyPayload'),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Create a policy for the current user organization',
        notes: 'The POST /authorization/policies endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.CreatePolicy
          }
        },
        response: { schema: swagger.Policy }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/policies/{id}',
      async handler (request) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        const { id } = request.params
        const { organizationId } = request.udaru
        const { version, name, statements } = request.payload

        return request.udaruCore.policies.update({ id, organizationId, version, name, statements })
      },
      config: {
        validate: {
          params: pick(validation.updatePolicy, ['id']),
          payload: Joi.object(pick(validation.updatePolicy, ['version', 'name', 'statements'])).label('UpdatePolicyPayload'),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Update a policy of the current user organization',
        notes: 'The PUT /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.UpdatePolicy,
            getParams: (request) => ({ policyId: request.params.id })
          }
        },
        response: { schema: swagger.Policy }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/policies/{id}',
      async handler (request, h) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        const { id } = request.params
        const { organizationId } = request.udaru

        return h.response(await request.udaruCore.policies.delete({ id, organizationId })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deletePolicy, ['id']),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Delete a policy',
        notes: 'The DELETE /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\n\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.DeletePolicy,
            getParams: (request) => ({ policyId: request.params.id })
          }
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/shared-policies',
      async handler (request) {
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        return { page, limit, ...(await request.udaruCore.policies.listShared({ limit, page })) }
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
          query: pick(validation.listSharedPolicies, ['page', 'limit'])
        },
        response: { schema: swagger.PagedPolicies }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/shared-policies/{id}',
      async handler (request) {
        return request.udaruCore.policies.readShared({ id: request.params.id })
      },
      config: {
        validate: {
          params: pick(validation.readSharedPolicy, ['id']),
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

    server.route({
      method: 'POST',
      path: '/authorization/shared-policies',
      async handler (request, h) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        const params = pick(request.payload, ['id', 'version', 'name', 'statements'])

        return h.response(await request.udaruCore.policies.createShared(params)).code(201)
      },
      config: {
        validate: {
          payload: Joi.object(pick(validation.createSharedPolicy, ['id', 'name', 'version', 'statements'])).label('CreateSharedPoliciesPayload'),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Create a policy shared across organizations',
        notes: 'The POST /authorization/shared-policies endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.CreatePolicy
          }
        },
        response: { schema: swagger.Policy }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/shared-policies/{id}',
      async handler (request) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        const { id } = request.params
        const { version, name, statements } = request.payload

        return request.udaruCore.policies.updateShared({ id, version, name, statements })
      },
      config: {
        validate: {
          params: pick(validation.updateSharedPolicy, ['id']),
          payload: Joi.object(pick(validation.updateSharedPolicy, ['version', 'name', 'statements'])).label('UpdateSharedPolicyPayload'),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Update a shared policy',
        notes: 'The PUT /authorization/shared-policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.UpdatePolicy,
            getParams: (request) => ({ policyId: request.params.id })
          }
        },
        response: { schema: swagger.Policy }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/shared-policies/{id}',
      async handler (request, h) {
        if (!hasValidServiceKey(request)) throw Boom.forbidden()

        return h.response(await request.udaruCore.policies.deleteShared({ id: request.params.id })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteSharedPolicy, ['id']),
          query: {
            sig: Joi.string().required()
          },
          headers
        },
        description: 'Delete a shared policy',
        notes: 'The DELETE /authorization/shared-policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\n\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
        tags: ['api', 'policies', 'private'],
        plugins: {
          auth: {
            action: Action.DeletePolicy,
            getParams: (request) => ({ policyId: request.params.id })
          }
        }
      }
    })
  }
}
