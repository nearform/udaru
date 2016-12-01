'use strict'

const PolicyOps = require('./../../lib/policyOps')

exports.register = function (server, options, next) {
  const policyOps = PolicyOps(options.dbPool)

   // curl http://localhost:8080/authorization/policies
  server.route({
    method: 'GET',
    path: '/authorization/policies',
    handler: function (request, reply) {
      policyOps.listAllPolicies([], reply)
    }
  })

  // curl http://localhost:8080/authorization/policy/123
  server.route({
    method: 'GET',
    path: '/authorization/policies/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      policyOps.readPolicyById(params, reply)
    }
  })

  next()
}

exports.register.attributes = {
  name: 'policies',
  version: '0.0.1'
}
