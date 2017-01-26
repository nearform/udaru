'use strict'

const Joi = require('joi')
const organizationOps = require('./../../lib/ops/organizationOps')
const Action = require('./../../lib/config/config.auth').Action
const conf = require('./../../lib/config')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      const limit = request.query.limit || conf.get('authorization.defaultPageSize')
      const page = request.query.page || 1
      organizationOps.list({
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
      tags: ['api', 'service', 'organizations'],
      plugins: {
        auth: {
          action: Action.ListOrganizations
        }
      },
      validate: {
        headers,
        query: Joi.object({
          page: Joi.number().integer().min(1).description('Page number, starts from 1'),
          limit: Joi.number().integer().min(1).description('Items per page')
        }).required()
      },
      response: {schema: swagger.List(swagger.Organization).label('PagedOrganizations')}
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      organizationOps.readById(request.params.id, reply)
    },
    config: {
      description: 'Get organization',
      notes: 'The GET /authorization/organizations/{id} endpoint returns a single organization data.\n',
      tags: ['api', 'service', 'organizations'],
      plugins: {
        auth: {
          action: Action.ReadOrganization,
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      validate: {
        params: {
          id: Joi.string().required().description('Organization ID')
        },
        headers
      },
      response: {schema: swagger.Organization}
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
        user: request.payload.user
      }

      organizationOps.create(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: {
          id: Joi.string().regex(/^[a-zA-Z0-9]{1,64}$/).required().description('Organization ID'),
          name: Joi.string().required().description('Organization name'),
          description: Joi.string().required().description('Organization description'),
          user: Joi.object().keys({
            id: Joi.string().description('User ID'),
            name: Joi.string().required().description('User name')
          })
        },
        headers
      },
      description: 'Create an organization',
      notes: 'The POST /authorization/organizations endpoint creates a new organization, the default organization admin policy and (if provided) its admin.',
      tags: ['api', 'service', 'post', 'organization'],
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
    handler: function (request, reply) {
      organizationOps.deleteById(request.params.id, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      description: 'DELETE an organization',
      notes: 'The DELETE /authorization/organizations/{id} endpoint will delete an organization.',
      tags: ['api', 'service', 'delete', 'organization'],
      plugins: {
        auth: {
          action: Action.DeleteOrganization,
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      validate: {
        params: {
          id: Joi.string().required().description('Organization ID')
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
      const { name, description } = request.payload

      organizationOps.update({id, name, description}, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('organization ID')
        },
        payload: {
          name: Joi.string().required().description('Organization name'),
          description: Joi.string().required().description('Organization description')
        },
        headers
      },
      description: 'Update an organization',
      notes: 'The PUT /authorization/organizations/{id} endpoint will update an organization name and description',
      tags: ['api', 'service', 'put', 'organization'],
      plugins: {
        auth: {
          action: Action.UpdateOrganization,
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      response: {schema: swagger.Organization}
    }
  })

  next()
}

exports.register.attributes = {
  name: 'organizations',
  version: '0.0.1'
}
