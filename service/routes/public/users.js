'use strict'

const Joi = require('joi')
const UserOps = require('./../../lib/userOps')

exports.register = function (server, options, next) {
  const userOps = UserOps(options.dbPool, server.logger())

  // curl http://localhost:8080/authorization/users
  server.route({
    method: 'GET',
    path: '/authorization/users',
    handler: function (request, reply) {
      userOps.listAllUsers([], reply)
    }
  })

  // curl http://localhost:8080/authorization/users/123
  server.route({
    method: 'GET',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      userOps.readUserById(params, reply)
    },
    config: {
      validate: {
        params: {id: Joi.number().required()}
      }
    }
  })

  // curl http://localhost:8080/authorization/users -X POST -H 'Content-Type: application/json' -d '{"name":"Violet Beauregarde"}'
  server.route({
    method: 'POST',
    path: '/authorization/users',
    handler: function (request, reply) {
      const params = [
        request.payload.name,
        'WONKA' // TODO: hardcode the org_id for now (as not yet fully implemented)
      ]

      userOps.createUser(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply(res).code(201)
      })
    },
    config: {
      validate: {
        payload: {name: Joi.string().required()}
      }
    }
  })

  // curl -X DELETE http://localhost:8080/authorization/users/123
  server.route({
    method: 'DELETE',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const params = [
        request.params.id
      ]

      userOps.deleteUserById(params, function (err, res) {
        if (err) {
          return reply(err)
        }

        return reply().code(204)
      })
    },
    config: {
      validate: {
        params: {id: Joi.number().required()}
      }
    }
  })

  // curl -X PUT http://localhost:8080/authorization/users/1 -H "Content-Type: application/json" -d '{"id": 1, "name": "Mrs Beauregarde",
  // "teams":[{"id": 3, "name": "Dream Team"}], "policies":[{"id": 4, "name": "DROP ALL TABLES!"}, { "id": 2, "name": "THROW DESK" }]}'
  server.route({
    method: 'PUT',
    path: '/authorization/users/{id}',
    handler: function (request, reply) {
      const id = request.params.id
      const { policies, teams, name } = request.payload
      const params = [
        id,
        name,
        teams,
        policies
      ]

      userOps.updateUser(params, reply)
    },
    config: {
      validate: {
        params: {id: Joi.number().required()},
        payload: {
          name: Joi.string().required(),
          teams: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          })),
          policies: Joi.array().required().items(Joi.object().keys({
            id: Joi.number().required()
          }))
        }
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'users',
  version: '0.0.1'
}
