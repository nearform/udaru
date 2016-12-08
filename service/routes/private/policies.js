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

      const { version, name, orgId, statements } = request.payload
      const params = [version, name, orgId, statements]

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
          version: Joi.string().required(),
          name: Joi.string().required(),
          orgId: Joi.string().required(),
          statements: Joi.string().required()
        }
      }
    }
  })

  server.route({
    method: 'PUT',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      const { version, name, orgId, statements } = request.payload
      const params = [request.params.id, version, name, orgId, statements]

      policyOps.updatePolicy(params, reply)
    },
    config: {
      validate: {
        params: {id: Joi.number().required()},
        payload: {
          version: Joi.string().required(),
          name: Joi.string().required(),
          orgId: Joi.string().required(),
          statements: Joi.string().required()
        }
      }
    }
  })

  server.route({
    method: 'DELETE',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      if (!security.hasValidServiceKey(request)) return reply(Boom.forbidden())

      policyOps.deletePolicyById([request.params.id], function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(204)
      })
    },
    config: {
      validate: {
        params: {id: Joi.number().required()}
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'provate-policies',
  version: '0.0.1'
}
