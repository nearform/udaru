'use strict'

const Joi = require('joi')
const PolicyOps = require('./../../lib/policyOps')
const security = require('./../security')
const Boom = require('boom')

exports.register = function (server, options, next) {
  const policyOps = PolicyOps(options.dbPool)

  server.route({
    method: 'POST',
    path: '/authorization/policies',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { version, name, statements } = request.payload
      const { id: organizationId } = request.authorization.organization

      const params = {
        version,
        name,
        organizationId,
        statements
      }
      policyOps.createPolicy(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: {
          version: Joi.string().required().description('policy version'),
          name: Joi.string().required().description('policy name'),
          statements: Joi.string().required().description('policy statements')
        }
      },
      description: 'Create a policy for the current user organization',
      notes: 'The POST /authorization/policies endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'post', 'policy', 'private']
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { id } = request.params
      const { id: organizationId } = request.authorization.organization
      const { version, name, statements } = request.payload

      const params = {
        id,
        organizationId,
        version,
        name,
        statements
      }

      policyOps.updatePolicy(params, reply)
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('policy id')
        },
        payload: {
          version: Joi.string().required().description('policy version'),
          name: Joi.string().required().description('policy name'),
          statements: Joi.string().required().description('policy statements')
        }
      },
      description: 'Update a policy of the current user organization',
      notes: 'The PUT /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'put', 'policy', 'private']
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { id } = request.params

      policyOps.deletePolicyById(id, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.number().required().description('policy id')
        }
      },
      description: 'Delete a policy',
      notes: 'The DELETE /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'delete', 'policy', 'private']
    }
  })

  next()
}

exports.register.attributes = {
  name: 'private-policies',
  version: '0.0.1'
}
