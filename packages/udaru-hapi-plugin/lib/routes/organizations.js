'use strict'

const Joi = require('joi')
const pick = require('lodash/pick')
const validation = require('@nearform/udaru-core/lib/ops/validation').organizations
const swagger = require('@nearform/udaru-core/lib/ops/validation').swagger
const headers = require('../headers')

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

        return { page, limit, ...(await request.udaruCore.organizations.list({ limit, page })) }
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
        response: { schema: swagger.PagedOrganizations }
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
            getParams: (request) => ({ organizationId: request.params.id })
          }
        },
        validate: {
          params: {
            id: validation.readById
          },
          headers
        },
        response: { schema: swagger.Organization }
      }
    })

    server.route({
      method: 'POST',
      path: '/authorization/organizations',
      async handler (request, h) {
        const { id, name, description, metadata, user } = request.payload

        return h.response(await request.udaruCore.organizations.create({ id, name, description, metadata, user })).code(201)
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
        response: { schema: swagger.OrganizationAndUser }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/organizations/{id}',
      async handler (request) {
        const { id } = request.params
        const { name, description, metadata } = request.payload

        return request.udaruCore.organizations.update({ id, name, description, metadata })
      },
      config: {
        validate: {
          params: pick(validation.update, ['id']),
          payload: Joi.object(pick(validation.update, ['name', 'description', 'metadata'])).label('UpdateOrgPayload'),
          headers
        },
        description: 'Update an organization',
        notes: 'The PUT /authorization/organizations/{id} endpoint will update an organization name and description',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.UpdateOrganization,
            getParams: (request) => ({ organizationId: request.params.id })
          }
        },
        response: { schema: swagger.Organization }
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
            getParams: (request) => ({ organizationId: request.params.id })
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
      method: 'POST',
      path: '/authorization/organizations/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { policies } = request.payload

        return request.udaruCore.organizations.replacePolicies({id, policies})
      },
      config: {
        validate: {
          params: pick(validation.replaceOrganizationPolicies, ['id']),
          payload: Joi.object(pick(validation.replaceOrganizationPolicies, ['policies'])).label('ReplaceOrgPoliciesPayload'),
          headers
        },
        description: 'Clear and replace the policies of an organization',
        notes: 'The POST /authorization/organizations/{id}/policies endpoint replaces all the organization policies. The existing organization policies are removed.',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ReplaceOrganizationPolicy,
            getParams: (request) => ({ organizationId: request.params.id })
          }
        },
        response: { schema: swagger.Organization }
      }
    })

    server.route({
      method: 'PUT',
      path: '/authorization/organizations/{id}/policies',
      async handler (request) {
        const { id } = request.params
        const { policies } = request.payload

        return request.udaruCore.organizations.amendPolicies({ id, policies })
      },
      config: {
        validate: {
          params: pick(validation.amendOrganizationPolicies, ['id']),
          payload: Joi.object(pick(validation.amendOrganizationPolicies, ['policies'])).label('AddPoliciesToOrgPayload'),
          headers
        },
        description: 'Add/update organization policy associations (specify instance to update, omit to add)',
        notes: 'The PUT /authorization/organizations/{id}/policies endpoint adds/updates the to the collection of policies associated with an organization',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.AmendOrganizationPolicies,
            getParams: (request) => ({ organizationId: request.params.id })
          }
        },
        response: { schema: swagger.Organization }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/organizations/{id}/policies',
      async handler (request, h) {
        return h.response(await request.udaruCore.organizations.deletePolicies({ id: request.params.id })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteOrganizationPolicies, ['id']),
          headers
        },
        description: 'Clear all policies of the organization',
        notes: 'The DELETE /authorization/organizations/{id}/policies endpoint removes all the organization policies.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.RemoveOrganizationPolicy,
            getParams: (request) => ({ organizationId: request.params.id })
          }
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/authorization/organizations/{id}/policies',
      async handler  (request) {
        const { id } = request.params
        const { organizationId } = request.udaru
        const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
        const page = request.query.page || 1

        await request.udaruCore.organizations.read(id)
        return request.udaruCore.organizations.listPolicies({ id, page, limit, organizationId })
      },
      config: {
        validate: {
          params: pick(validation.listOrganizationPolicies, ['id']),
          query: pick(validation.listOrganizationPolicies, ['page', 'limit']),
          headers
        },
        description: 'Fetch organization policies given its identifier',
        notes: 'The GET /authorization/organization/{id}/policies endpoint returns the organization policies.\n',
        tags: ['api', 'organizations'],
        plugins: {
          auth: {
            action: Action.ListOrganizationPolicies,
            getParams: (request) => ({ id: request.params.id })
          }
        },
        response: { schema: swagger.PagedPolicyRefs }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/authorization/organizations/{id}/policies/{policyId}',
      async handler (request, h) {
        const { id, policyId } = request.params
        const { instance } = request.query

        return h.response(await request.udaruCore.organizations.deletePolicy({ id, policyId, instance })).code(204)
      },
      config: {
        validate: {
          params: pick(validation.deleteOrganizationPolicy, ['id', 'policyId']),
          headers
        },
        description: 'Remove a policy associated with an organization',
        notes: 'The DELETE /authorization/organizations/{id}/policies/{policyId} endpoint disassociates a specific policy from an organization.\n' +
          'Set optional parameter instance to delete a specific policy instance with variables, or leave blank to remove all instances with this policyId.\n',
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
