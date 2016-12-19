'use strict'

const Joi = require('joi')
const OrganizationOps = require('./../../lib/organizationOps')

exports.register = function (server, options, next) {
  const organizationOps = OrganizationOps(options.dbPool, server.logger())

  server.route({
    method: 'GET',
    path: '/authorization/organizations',
    handler: function (request, reply) {
      organizationOps.list(reply)
    },
    config: {
      description: 'List all the organizations [TBD]',
      tags: ['api', 'service', 'organizations']
    }
  })

  server.route({
    method: 'GET',
    path: '/authorization/organizations/{id}',
    handler: function (request, reply) {
      organizationOps.readById(request.params.id, reply)
    },
    config: {
      description: 'Get organization [TBD]',
      tags: ['api', 'service', 'organizations']
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
            name: Joi.string().required()
          })
        }
      },
      description: 'Create an organization',
      notes: 'The POST /authorization/organizations endpoint will create a new organization, the default organization admin policy and (if provided) its admin.',
      tags: ['api', 'service', 'post', 'organization']
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
      tags: ['api', 'service', 'delete', 'organization']
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
        payload: {
          name: Joi.string().required().description('organization name'),
          description: Joi.string().required().description('organization description')
        }
      },
      description: 'Update an organization',
      notes: 'The PUT /authorization/organizations/{id} endpoint will update an organization name and description',
      tags: ['api', 'service', 'put', 'organization']
    }
  })

  next()
}

exports.register.attributes = {
  name: 'organizations',
  version: '0.0.1'
}
