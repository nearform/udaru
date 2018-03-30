'use strict'
const Joi = require('joi')
const _ = require('lodash')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('@nearform/udaru-core/lib/ops/validation').organizations

exports.register = function (server, options, next) {
  const Action = server.udaruConfig.get('AuthConfig.Action')

  server.route({
    method: 'GET',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      const limit = request.query.limit || server.udaruConfig.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      request.udaruCore.organizations.list({
        limit: limit,
        page: page
      }, (err, data, total) => {
        reply(
          err,
          err ? null : {
            page: page,
            limit: limit,
            total: total,
            data: data
          }
        )
      })
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
    handler: function (request, reply) {
      request.udaruCore.organizations.read(request.params.id, reply)
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
    handler: function (request, reply) {
      const params = {
        id: request.payload.id,
        name: request.payload.name,
        description: request.payload.description,
        metadata: request.payload.metadata,
        user: request.payload.user
      }

      request.udaruCore.organizations.create(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
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
    method: 'DELETE',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      request.udaruCore.organizations.delete(request.params.id, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
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
    method: 'PUT',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      const { id } = request.params
      const { name, description, metadata } = request.payload

      request.udaruCore.organizations.update({ id, name, description, metadata }, reply)
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
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      response: { schema: swagger.Organization }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/organizations/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { policies } = request.payload

      request.udaruCore.organizations.addPolicies({ id, policies }, reply)
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
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      response: { schema: swagger.Organization }
    }
  })

  server.route({
    method: 'POST',
    path: '/authorization/organizations/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params
      const { policies } = request.payload

      request.udaruCore.organizations.replacePolicies({ id, policies }, reply)
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
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      response: { schema: swagger.Organization }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/organizations/{id}/policies',
    handler: function (request, reply) {
      const { id } = request.params

      request.udaruCore.organizations.deletePolicies({ id }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
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
          getParams: (request) => ({ organizationId: request.params.id })
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/organizations/{id}/policies/{policyId}',
    handler: function (request, reply) {
      const { id, policyId } = request.params
      const { instance } = request.query

      request.udaruCore.organizations.deletePolicy({ id, policyId, instance }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: _.pick(validation.deleteOrganizationPolicy, ['id', 'policyId']),
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
  next()
}

exports.register.attributes = {
  name: 'organizations',
  version: '0.0.1'
}
