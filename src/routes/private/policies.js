'use strict'

const Joi = require('joi')
const Boom = require('boom')
const serviceKey = require('./../../security/serviceKey')
const Action = require('./../../lib/config/config.auth').Action
const policyOps = require('./../../lib/ops/policyOps')
const swagger = require('./../../swagger')
const headers = require('./../headers')

exports.register = function (server, options, next) {

  server.route({
    method: 'POST',
    path: '/authorization/policies',
    handler: function (request, reply) {
      if (!serviceKey.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { id, version, name, statements } = request.payload
      const { organizationId } = request.udaru

      const params = {
        id,
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
          id: Joi.string().allow('').description('Policy ID'),
          version: Joi.string().required().description('Policy version'),
          name: Joi.string().required().description('Policy name'),
          statements: swagger.PolicyStatements.required().description('Policy statements')
        },
        query: {
          sig: Joi.string().required()
        },
        headers
      },
      description: 'Create a policy for the current user organization',
      notes: 'The POST /authorization/policies endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'post', 'policy', 'private'],
      plugins: {
        auth: {
          action: Action.CreatePolicy
        }
      },
      response: {schema: swagger.Policy}
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!serviceKey.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { id } = request.params
      const { organizationId } = request.udaru
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
          id: Joi.string().required().description('Policy ID')
        },
        payload: {
          version: Joi.string().required().description('Policy version'),
          name: Joi.string().required().description('Policy name'),
          statements: swagger.PolicyStatements.required().description('Policy statements')
        },
        query: {
          sig: Joi.string().required()
        },
        headers
      },
      description: 'Update a policy of the current user organization',
      notes: 'The PUT /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'put', 'policy', 'private'],
      plugins: {
        auth: {
          action: Action.UpdatePolicy,
          getParams: (request) => ({ policyId: request.params.id })
        }
      },
      response: {schema: swagger.Policy}
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!serviceKey.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { id } = request.params
      const { organizationId } = request.udaru

      policyOps.deletePolicy({ id, organizationId }, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(204)
      })
    },
    config: {
      validate: {
        params: {
          id: Joi.string().required().description('Policy ID')
        },
        query: {
          sig: Joi.string().required()
        },
        headers
      },
      description: 'Delete a policy',
      notes: 'The DELETE /authorization/policies/{id} endpoint is a private endpoint. It can be accessed only using a service key.\n\nThis service key needs to be passed as a query string in the form "sig=<key>"\n',
      tags: ['api', 'service', 'delete', 'policy', 'private'],
      plugins: {
        auth: {
          action: Action.DeletePolicy,
          getParams: (request) => ({ policyId: request.params.id })
        }
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'private-policies',
  version: '0.0.1'
}
