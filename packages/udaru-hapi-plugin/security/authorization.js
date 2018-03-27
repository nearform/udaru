'use strict'

const _ = require('lodash')
const Boom = require('boom')
const { promisify } = require('util')

module.exports = function (config) {
  const Action = config.get('AuthConfig.Action')
  const actionsNeedingValidation = [Action.ReplaceUserTeams, Action.DeleteUserTeams]

  function getAuthParams (request) {
    return request.route.settings.plugins && request.route.settings.plugins.auth
  }

  async function getTeams (server, request) {
    const authParams = getAuthParams(request)
    if (!authParams || !authParams.action) {
      throw Boom.forbidden('Invalid credentials', 'udaru')
    }

    if (Action.ReplaceUserTeams === authParams.action) {
      // this is called before we get to routing so needs to be validated first
      const teams = _.get(request, 'payload.teams')
      if (!teams || !Array.isArray(teams)) {
        throw Boom.badRequest('No teams found in payload', 'udaru')
      }
      return teams
    }

    if (Action.DeleteUserTeams === authParams.action) {
      const { user: currentUser } = request.udaru
      const getUser = promisify(request.udaruCore.users.read)

      if (!currentUser) {
        throw Boom.forbidden('Invalid credentials', 'udaru')
      }

      const requestParams = authParams.getParams ? authParams.getParams(request) : {}
      const organizationId = request.headers.org || currentUser.organizationId

      const user = await getUser({id: requestParams.userId, organizationId})

      return user.teams.map(t => t.id)
    }
  }

  function needTeamsValidation (request) {
    const authParams = getAuthParams(request)

    if (!authParams) {
      return false
    }

    return actionsNeedingValidation.includes(authParams.action)
  }

  async function validateTeamsInPayload (server, request, h) {
    const isUserAuthorized = promisify(request.udaruCore.authorize.isUserAuthorized)

    const teams = await getTeams(server, request)

    const { user: currentUser } = request.udaru
    const authParams = getAuthParams(request)
    const resourceType = request.route.path.split('/')[2]
    const resourceBuilder = server.udaruConfig.get('AuthConfig.resources')[resourceType]

    if (!resourceBuilder) {
      throw Boom.badImplentation('Resource builder not found')
    }

    for (const team of teams) {
      const params = {
        userId: currentUser.id,
        teamId: team,
        organizationId: currentUser.organizationId
      }
      const resource = resourceBuilder(params)
      const { action } = authParams

      const result = await isUserAuthorized({userId: currentUser.id, action, resource, organizationId: currentUser.organizationId})

      if (!result || !result.access) {
        throw Boom.forbidden(`Not enough permissions to modify team ${team}`)
      }
    }

    return h.continue
  }

  async function authorize (server, settings, request) {
    const req = request.raw.req
    const authorization = req.headers.authorization

    if (!authorization) {
      throw Boom.unauthorized('Missing authorization', 'udaru')
    }

    const userId = String(authorization)

    const credentials = await settings.validateFunc(server, request, userId)
    request.udaru = credentials

    return {credentials: {scope: 'udaru'}}
  }

  return {
    getAuthParams,
    needTeamsValidation,
    validateTeamsInPayload,
    authorize
  }
}
