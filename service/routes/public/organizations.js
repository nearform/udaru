'use strict'

const Joi = require('joi')
const organizationOps = require('./../../lib/ops/organizationOps')
const Action = require('./../../lib/config/config.auth').Action
const swagger = require('./../../swagger')

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      organizationOps.list(reply)
    },
    config: {
      description: 'List all the organizations',
      tags: ['api', 'service', 'organizations'],
      plugins: {
        auth: {
          action: Action.ListOrganizations
        }
      },
      validate: {
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      response: {schema: swagger.OrganizationList}
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
      tags: ['api', 'service', 'organizations'],
      plugins: {
        auth: {
          action: Action.ReadOrganization,
          getParams: (request) => ({ organizationId: request.params.id })
        }
      },
      validate: {
        params: {
          id: Joi.string().required().description('organization id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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
          id: Joi.string().regex(/^[a-zA-Z0-9]{1,64}$/).required().description('organization id'),
          name: Joi.string().required().description('organization name'),
          description: Joi.string().required().description('organization description'),
          user: Joi.object().keys({
            name: Joi.string().required('Name for the user'),
            token: Joi.string().required('user identifier')
          })
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      },
      description: 'Create an organization',
      notes: 'The POST /authorization/organizations endpoint will create a new organization, the default organization admin policy and (if provided) its admin.',
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
      const params = [
        request.params.id
      ]

      organizationOps.deleteById(params, function (err, res) {
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
          id: Joi.string().required().description('organization id')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id,
        request.payload.name,
        request.payload.description
      ]

      organizationOps.update(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('organization id')
        },
        payload: {
          name: Joi.string().required().description('organization name'),
          description: Joi.string().required().description('organization description')
        },
        headers: Joi.object({
          'authorization': Joi.any().required()
        }).unknown()
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
