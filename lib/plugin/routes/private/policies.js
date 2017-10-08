'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Boom = require('boom')
const buildServiceKey = require('./../../security/serviceKey')
const swagger = require('./../../swagger')
const headers = require('./../headers')
const validation = require('../../../core/lib/ops/validation').policies

function buildPolicies (udaru, config) {
  function register (server, options, next) {
    const serviceKey = buildServiceKey(config)
    const Action = config.get('AuthConfig.Action')

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

        udaru.policies.create(params, function (err, res) {
          if (err) {
            return reply(err)
          }

          return reply(res).code(201)
        })
      },
      config: {
        validate: {
          payload: _.pick(validation.createPolicy, ['id', 'name', 'version', 'statements']),
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

        udaru.policies.update(params, reply)
      },
      config: {
        validate: {
          params: _.pick(validation.updatePolicy, ['id']),
          payload: _.pick(validation.updatePolicy, ['version', 'name', 'statements']),
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

        udaru.policies.delete({ id, organizationId }, function (err, res) {
          if (err) {
            return reply(err)
          }

          return reply(res).code(204)
        })
      },
      config: {
        validate: {
          params: _.pick(validation.deletePolicy, ['id']),
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

    next()
  }

  register.attributes = {
    name: 'private-policies',
    version: '0.0.1'
  }

  return register
}

module.exports = buildPolicies
