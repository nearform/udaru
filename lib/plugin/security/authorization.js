'use strict'

const _ = require('lodash')
const Boom = require('boom')
const async = require('async')

function buildAuthorization (config) {
  const Action = config.get('AuthConfig.Action')
  const actionsNeedingValidation = [Action.ReplaceUserTeams, Action.DeleteUserTeams]

  function getAuthParams (request) {
    return request.route.settings.plugins && request.route.settings.plugins.auth
  }

  function getTeams (server, request, callback) {
    const authParams = getAuthParams(request)
    if (!authParams || !authParams.action) {
      return callback(Boom.forbidden('Invalid credentials', 'udaru'))
    }

    if (Action.ReplaceUserTeams === authParams.action) {
      // this is called before we get to routing so needs to be validated first
      const teams = _.get(request, 'payload.teams')
      if (!teams || !Array.isArray(teams)) {
        return callback(Boom.badRequest('No teams found in payload', 'udaru'))
      }
      return callback(null, teams)
    }

    if (Action.DeleteUserTeams === authParams.action) {
      const { user: currentUser } = request.udaru
      if (!currentUser) {
        return callback(Boom.forbidden('Invalid credentials', 'udaru'))
      }

      const requestParams = authParams.getParams ? authParams.getParams(request) : {}
      const organizationId = request.headers.org || currentUser.organizationId

      request.udaruCore.users.read({ id: requestParams.userId, organizationId }, function (err, user) {
        if (err) return callback(err)

        return callback(null, user.teams.map(t => t.id))
      })
    }
  }

  function needTeamsValidation (request) {
    const authParams = getAuthParams(request)

    if (!authParams) {
      return false
    }

    return _.includes(actionsNeedingValidation, authParams.action)
  }

  function validateTeamsInPayload (server, request, reply) {
    getTeams(server, request, function (err, teams) {
      if (err) return reply(err)

      const { user: currentUser } = request.udaru
      const authParams = getAuthParams(request)
      const resourceType = request.route.path.split('/')[2]
      const resourceBuilder = server.udaruConfig.get('AuthConfig.resources')[resourceType]

      if (!resourceBuilder) {
        return reply(Boom.badImplentation('Resource builder not found'))
      }

      const tasks = teams.map(function (team) {
        const params = {
          userId: currentUser.id,
          teamId: team,
          organizationId: currentUser.organizationId
        }
        const resource = resourceBuilder(params)
        const { action } = authParams

        return function check (callback) {
          request.udaruCore.authorize.isUserAuthorized({ userId: currentUser.id, action, resource, organizationId: currentUser.organizationId }, (err, result) => {
            if (err || !result || !result.access) return callback(err || new Error(`Not enough permissions to modify team ${team}`))
            callback()
          })
        }
      })

      async.series(tasks, function (err) {
        if (err) return reply(err.isBoom ? err : Boom.forbidden(err))

        reply.continue()
      })
    })
  }

  function authorize (server, settings, request, reply) {
    const req = request.raw.req
    const authorization = req.headers.authorization

    if (!authorization) {
      return reply(Boom.unauthorized('Missing authorization', 'udaru'))
    }

    const userId = String(authorization)

    settings.validateFunc(server, request, userId, (err, credentials) => {
      if (err) return reply(err)

      request.udaru = credentials

      return reply.continue({ credentials: { scope: 'udaru' } })
    })
  }

  return {
    getAuthParams,
    needTeamsValidation,
    validateTeamsInPayload,
    authorize
  }
}

module.exports = buildAuthorization
