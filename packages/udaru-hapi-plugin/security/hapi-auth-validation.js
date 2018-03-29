'use strict'

const Boom = require('boom')

module.exports = function (authorization) {
  function canImpersonate (request, user) {
    return user.organizationId === request.server.udaruConfig.get('authorization.superUser.organization.id')
  }

  async function loadUser (job) {
    const { userId } = job

    try {
      const organizationId = await job.udaru.getUserOrganizationId(userId)
      job.currentUser = await job.udaru.users.read({id: userId, organizationId})
    } catch (e) {
      throw Boom.unauthorized('Bad credentials')
    }
  }

  async function impersonate (job) {
    const { currentUser } = job
    job.organizationId = currentUser.organizationId

    if (canImpersonate(job.request, currentUser) && job.requestedOrganizationId) {
      job.organizationId = job.requestedOrganizationId
    }
  }

  async function checkAuthorization (udaru, userId, action, organizationId, resource, done) {
    const params = {userId, action, organizationId, resource}

    const result = await udaru.authorize.isUserAuthorized(params)

    return result.access
  }

  async function buildResourcesForUser (udaru, builder, buildParams, organizationId) {
    const resources = [builder(buildParams)]

    try {
      const user = await udaru.users.read({id: buildParams.userId, organizationId: organizationId})

      user.teams.forEach((team) => {
        buildParams.teamId = team.id
        resources.push(builder(buildParams))
      })

      return resources
    } catch (err) {
      if (err.output && err.output.statusCode === 404) {
        return resources
      }

      throw err
    }
  }

  function buildResources (options, udaru, authParams, request, organizationId) {
    let resource = authParams.resource

    if (resource) {
      return [resource]
    }

    const resourceType = request.route.path.split('/')[2]
    const resourceBuilder = request.server.udaruConfig.get('AuthConfig.resources')[resourceType]

    if (!resourceBuilder) {
      throw new Error('Resource builder not found')
    }

    const requestParams = authParams.getParams ? authParams.getParams(request) : {}
    const buildParams = Object.assign({}, {organizationId}, requestParams)

    if (resourceType === 'users' && buildParams.userId) {
      return buildResourcesForUser(udaru, resourceBuilder, buildParams, organizationId)
    }

    return [resourceBuilder(buildParams)]
  }

  async function authorize (job) {
    const resources = await buildResources(job.options, job.udaru, job.authParams, job.request, job.organizationId)

    const action = job.authParams.action
    const userId = job.currentUser.id
    const organizationId = job.currentUser.organizationId

    const valids = await Promise.all(resources.map(resource => checkAuthorization(job.udaru, userId, action, organizationId, resource)))

    if (!valids.includes(true)) {
      throw Boom.forbidden('Invalid credentials', 'udaru')
    }
  }

  async function authValidation (options, server, request, userId, callback) {
    const authParams = authorization.getAuthParams(request)
    const udaru = request.udaruCore

    if (!authParams) {
      throw Boom.forbidden('Invalid credentials', 'udaru')
    }

    const job = {
      udaru,
      options,
      userId,
      request,
      authParams,
      requestedOrganizationId: request.headers.org
    }

    await loadUser(job)
    await impersonate(job)
    await authorize(job)

    return {user: job.currentUser, organizationId: job.organizationId}
  }

  return authValidation
}
