'use strict'

const Boom = require('boom')
const getProperty = require('lodash/get')

module.exports = function (config) {
  const Action = config.get('AuthConfig.Action')
  const actionsNeedingValidation = [Action.ReplaceUserTeams, Action.DeleteUserTeams]

  function getAuthParams (request, def = null) {
    return getProperty(request, 'route.settings.plugins.auth', def)
  }

  async function getTeams (server, request) {
    const authParams = getAuthParams(request)

    switch (authParams.action) {
      case Action.ReplaceUserTeams:
        // This is called before we get to routing so needs to be validated first
        const teams = getProperty(request, 'payload.teams')
        if (!teams || !Array.isArray(teams)) throw Boom.badRequest('No teams found in payload', 'udaru')

        return teams
      case Action.DeleteUserTeams:
        const { user: currentUser } = request.udaru

        const requestParams = authParams.getParams(request)
        const organizationId = request.headers.org || currentUser.organizationId
        const user = await request.udaruCore.users.read({ id: requestParams.userId, organizationId })

        return user.teams.map(t => t.id)
    }
  }

  function needTeamsValidation (request) {
    const authParams = getAuthParams(request, {})

    return actionsNeedingValidation.includes(authParams.action)
  }

  async function validateTeamsInPayload (server, request, h) {
    const teams = await getTeams(server, request)
    const { user: currentUser } = request.udaru
    const authParams = getAuthParams(request)
    const resourceType = request.route.path.split('/')[2]
    const resourceBuilder = server.udaruConfig.get('AuthConfig.resources')[resourceType]

    if (!resourceBuilder) throw new Error('Resource builder not found')

    for (const teamId of teams) {
      const { id: userId, organizationId } = currentUser
      const resource = resourceBuilder({ userId, teamId, organizationId })
      const { action } = authParams

      const result = await request.udaruCore.authorize.isUserAuthorized({ userId, action, resource, organizationId })

      if (!getProperty(result, 'access')) throw Boom.forbidden(`Not enough permissions to modify team ${teamId}`)
    }

    return h.continue
  }

  function hasValidServiceKey (request) {
    const validKeys = config.get('security.api.servicekeys.private')

    return validKeys.includes(getProperty(request, 'query.sig', ''))
  }

  return {
    getAuthParams,
    needTeamsValidation,
    validateTeamsInPayload,
    hasValidServiceKey
  }
}
