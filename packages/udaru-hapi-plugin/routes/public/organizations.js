'use strict'
const Joi = require('joi')
const _ = require('lodash')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('@nearform/udaru-core/lib/ops/validation').organizations

module.exports = {
  name: 'organizations',
  version: '0.0.1',
  register (server, options) {
    const Action = server.udaruConfig.get('AuthConfig.Action')

    server.route({
      method: 'GET',
      path: '/authorization/organizations',
      async handler (request) {
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        return {page, limit, ...(await request.udaruCore.organizations.list({limit: limit, page: page}))}
      },
      config: {
        description: 'List all the organizations',
        notes: 'The GET /authorization/organizations endpoint returns a list of all organizations.\n\nThe results are paginated. Page numbering and page limit start from 1.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ListOrganizations
          }
        },
        validate: {
          headers,
          query: validation.list
        },
        response: {schema: swagger.PagedOrganizations}
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/organizations/{id}',
      async handler (request) {
        return request.udaruCore.organizations.read(request.params.id)
      },
      config: {
        description: 'Get organization',
        notes: 'The GET /authorization/organizations/{id} endpoint returns a single organization data.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ReadOrganization,
            getParams: (request) => ({organizationId: request.params.id})
          }
        },
        validate: {
          params: {
            id: validation.readById
          },
          headers
        },
        response: {schema: swagger.Organization}
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/organizations',
      async handler (request, h) {
        const { id, name, description, metadata, user } = request.payload

        return h.response(await request.udaruCore.organizations.create({id, name, description, metadata, user})).code(201)
      },
      config: {
        validate: {
          payload: Joi.object(validation.create).label('CreateOrgPayload'),
          headers
        },
        description: 'Create an organization',
        notes: 'The POST /authorization/organizations endpoint creates a new organization, the default organization admin policy and (if provided) its admin.',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.CreateOrganization
          }
        },
        response: {schema: swagger.OrganizationAndUser}
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/organizations/{id}',
      async handler (request, h) {
        return h.response(await request.udaruCore.organizations.delete(request.params.id)).code(204)
      },
      config: {
        description: 'DELETE an organization',
        notes: 'The DELETE /authorization/organizations/{id} endpoint will delete an organization.',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.DeleteOrganization,
            getParams: (request) => ({organizationId: request.params.id})
          }
        },
        validate: {
          params: {
            id: validation.deleteById
          },
          headers
        }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/organizations/{id}',
      async handler (request) {
        const { id } = request.params
        const { name, description, metadata } = request.payload

        return request.udaruCore.organizations.update({id, name, description, metadata})
      },
      config: {
        validate: {
          params: _.pick(validation.update, ['id']),
          payload: Joi.object(_.pick(validation.update, ['name', 'description', 'metadata'])).label('UpdateOrgPayload'),
          headers
        },
        description: 'Update an organization',
        notes: 'The PUT /authorization/organizations/{id} endpoint will update an organization name and description',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.UpdateOrganization,
            getParams: (request) => ({organizationId: request.params.id})
          }
        },
        response: {schema: swagger.Organization}
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/organizations/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { policies } = request.payload

        return request.udaruCore.organizations.addPolicies({id, policies})
      },
      config: {
        validate: {
          params: _.pick(validation.addOrganizationPolicies, ['id']),
          payload: Joi.object(_.pick(validation.addOrganizationPolicies, ['policies'])).label('AddPoliciesToOrgPayload'),
          headers
        },
        description: 'Add one or more policies to an organization',
        notes: 'The PUT /authorization/organizations/{id}/policies endpoint adds one or more policies to an organization.',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.AddOrganizationPolicy,
            getParams: (request) => ({organizationId: request.params.id})
          }
        },
        response: {schema: swagger.Organization}
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/organizations/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { policies } = request.payload

        return request.udaruCore.organizations.replacePolicies({id, policies})
      },
      config: {
        validate: {
          params: _.pick(validation.replaceOrganizationPolicies, ['id']),
          payload: Joi.object(_.pick(validation.replaceOrganizationPolicies, ['policies'])).label('ReplaceOrgPoliciesPayload'),
          headers
        },
        description: 'Clear and replace the policies of an organization',
        notes: 'The POST /authorization/organizations/{id}/policies endpoint replaces all the organization policies. The existing organization policies are removed.',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ReplaceOrganizationPolicy,
            getParams: (request) => ({organizationId: request.params.id})
          }
        },
        response: {schema: swagger.Organization}
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/organizations/{id}/policies',
      async handler (request, h) {
        return h.response(await request.udaruCore.organizations.deletePolicies({id: request.params.id})).code(204)
      },
      config: {
        validate: {
          params: _.pick(validation.deleteOrganizationPolicies, ['id']),
          headers
        },
        description: 'Clear all policies of the organization',
        notes: 'The DELETE /authorization/organizations/{id}/policies endpoint removes all the organization policies.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.RemoveOrganizationPolicy,
            getParams: (request) => ({organizationId: request.params.id})
          }
        }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/organizations/{id}/policies/{policyId}',
      async handler (request, h) {
        const { id, policyId } = request.params

        return h.response(await request.udaruCore.organizations.deletePolicy({id, policyId})).code(204)
      },
      config: {
        validate: {
          params: _.pick(validation.deleteOrganizationPolicy, ['id', 'policyId']),
          headers
        },
        description: 'Remove a policy from one organization',
        notes: 'The DELETE /authorization/organizations/{id}/policies/{policyId} endpoint removes a specific policy from the organization.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.RemoveOrganizationPolicy,
            getParams: (request) => ({
              organizationId: request.params.id,
              policyId: request.params.policyId
            })
          }
        }
      }
    })
  }
}
