'use strict'

const Hoek = require('hoek')
const Boom = require('boom')

async function loadUser (job) {
  const { userId } = job

  try {
    const organizationId = await job.udaru.getUserOrganizationId(userId)
    job.currentUser = await job.udaru.users.read({ id: userId, organizationId })
  } catch (e) {
    throw Boom.unauthorized('Bad credentials')
  }
}

function canImpersonate (request, user) {
  return user.organizationId === request.server.udaruConfig.get('authorization.superUser.organization.id')
}

async function impersonate (job) {
  const { currentUser } = job
  job.organizationId = currentUser.organizationId

  if (canImpersonate(job.request, currentUser) && job.requestedOrganizationId) job.organizationId = job.requestedOrganizationId
}

async function checkAuthorization (udaru, userId, action, organizationId, resource, done) {
  const result = await udaru.authorize.isUserAuthorized({ userId, action, organizationId, resource })

  return result.access
}

async function buildResourcesForUser (udaru, builder, buildParams, organizationId) {
  const resources = [builder(buildParams)]

  try {
    const user = await udaru.users.read({ id: buildParams.userId, organizationId: organizationId })

    for (const team of user.teams) {
      buildParams.teamId = team.id
      resources.push(builder(buildParams))
    }

    return resources
  } catch (err) {
    if (err.output && err.output.statusCode === 404) return resources
    throw err
  }
}

function buildResources (options, udaru, authParams, request, organizationId) {
  let resource = authParams.resource

  if (resource) return [resource]

  const resourceType = request.route.path.split('/')[2]
  const resourceBuilder = request.server.udaruConfig.get('AuthConfig.resources')[resourceType]
  if (!resourceBuilder) throw Boom.badImplementation('Resource builder not found')

  const requestParams = authParams.getParams ? authParams.getParams(request) : {}
  const buildParams = Object.assign({}, {organizationId}, requestParams)

  if (resourceType === 'users' && buildParams.userId) return buildResourcesForUser(udaru, resourceBuilder, buildParams, organizationId)

  return [resourceBuilder(buildParams)]
}

async function authorize (job) {
  const resources = await buildResources(job.options, job.udaru, job.authParams, job.request, job.organizationId)

  const action = job.authParams.action
  const userId = job.currentUser.id
  const organizationId = job.currentUser.organizationId

  const valids = await Promise.all(resources.map(resource => checkAuthorization(job.udaru, userId, action, organizationId, resource)))

  if (!valids.includes(true)) throw Boom.forbidden('Invalid credentials', 'udaru')
}

async function validate (options, server, request, userId, callback) {
  const authParams = server.udaruAuthorization.getAuthParams(request)
  const udaru = request.udaruCore

  if (!authParams) throw Boom.forbidden('Invalid credentials', 'udaru')

  const job = {udaru, options, userId, request, authParams, requestedOrganizationId: request.headers.org}

  await loadUser(job)
  await impersonate(job)
  await authorize(job)

  return {user: job.currentUser, organizationId: job.organizationId}
}

async function authenticate (server, settings, request) {
  const req = request.raw.req
  const authorization = req.headers.authorization

  if (!authorization) throw Boom.unauthorized('Missing authorization', 'udaru')

  const userId = String(authorization)

  const credentials = await settings.validateFunc(settings, server, request, userId)
  request.udaru = credentials

  return {credentials: {scope: 'udaru'}}
}

module.exports = {
  name: 'Udaru Authentication',
  version: '0.0.1',

  validate,

  register (server, options) {
    server.auth.scheme('udaru', function (server, options) {
      Hoek.assert(options, 'Missing service auth strategy options')

      if (typeof options.validateFunc === 'undefined' || options.validateFunc === null) options.validateFunc = validate
      Hoek.assert(typeof options.validateFunc === 'function', 'options.validateFunc must be a valid function')

      const settings = Hoek.clone(options)

      const scheme = {
        async authenticate (request, h) {
          return h.authenticated(await authenticate(server, settings, request))
        },

        payload (request, h) {
          if (server.udaruAuthorization.needTeamsValidation(request)) return request.server.udaruAuthorization.validateTeamsInPayload(server, request, h)

          return h.continue
        },

        options: {
          payload: true
        }
      }

      return scheme
    })
  }
}
