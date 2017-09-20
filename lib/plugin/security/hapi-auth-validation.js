'use strict'

const async = require('async')
const Boom = require('boom')

function buildAuthValidation (udaru, config, authorization) {
  function canImpersonate (options, user) {
    return user.organizationId === config.get('authorization.superUser.organization.id')
  }

  function loadUser (job, next) {
    const { userId } = job

    job.udaru.getUserOrganizationId(userId, (err, organizationId) => {
      if (err) return next(Boom.unauthorized('Bad credentials'))

      job.udaru.users.read({ id: userId, organizationId }, (err, user) => {
        if (err) return next(Boom.unauthorized('Bad credentials'))
        job.currentUser = user

        next()
      })
    })
  }

  function impersonate (job, next) {
    const { currentUser } = job
    job.organizationId = currentUser.organizationId

    if (canImpersonate(job.options, currentUser) && job.requestedOrganizationId) {
      job.organizationId = job.requestedOrganizationId
    }

    next()
  }

  function checkAuthorization (udaru, userId, action, organizationId, resource, done) {
    const params = { userId, action, organizationId, resource }

    udaru.authorize.isUserAuthorized(params, (err, result) => {
      if (err) return done(err)
      done(null, result.access)
    })
  }

  function buildResourcesForUser (udaru, builder, userId, organizationId, done) {
    const buildParams = {
      userId,
      teamId: '*',
      organizationId
    }

    const resources = [builder(buildParams)]

    udaru.users.read({ id: userId, organizationId: organizationId }, (err, user) => {
      if (err && err.output.statusCode === 404) return done(null, resources)
      if (err) return done(err)

      user.teams.forEach((team) => {
        buildParams.teamId = team.id
        resources.push(builder(buildParams))
      })

      done(null, resources)
    })
  }

  function buildResources (options, udaru, authParams, request, organizationId, done) {
    let resource = authParams.resource

    if (resource) {
      return done(null, [resource])
    }

    const resourceType = request.route.path.split('/')[2]
    const resourceBuilder = config.get('AuthConfig.resources')[resourceType]

    if (!resourceBuilder) {
      return done(new Error('Resource builder not found'))
    }

    const requestParams = authParams.getParams ? authParams.getParams(request) : {}
    const buildParams = Object.assign({}, { organizationId }, requestParams)

    if (resourceType === 'users' && buildParams.userId) {
      return buildResourcesForUser(udaru, resourceBuilder, buildParams.userId, organizationId, done)
    }

    done(null, [resourceBuilder(buildParams)])
  }

  function authorize (job, next) {
    buildResources(job.options, job.udaru, job.authParams, job.request, job.organizationId, (err, resources) => {
      if (err) return Boom.unauthorized('Bad credentials')

      const action = job.authParams.action
      const userId = job.currentUser.id
      const organizationId = job.currentUser.organizationId

      async.any(resources, async.apply(checkAuthorization, job.udaru, userId, action, organizationId), (err, valid) => {
        if (err) return next(Boom.forbidden('Invalid credentials', 'udaru'))
        if (!valid) return next(Boom.forbidden('Invalid credentials', 'udaru'))

        next()
      })
    })
  }

  function authValidation (options, server, request, userId, callback) {
    const authParams = authorization.getAuthParams(request)

    if (!authParams) {
      return callback(Boom.forbidden('Invalid credentials', 'udaru'))
    }

    const job = {
      udaru,
      options,
      userId,
      request,
      authParams,
      requestedOrganizationId: request.headers.org
    }

    async.applyEachSeries([
      loadUser,
      impersonate,
      authorize
    ], job, (err) => {
      if (err) return callback(err)
      callback(null, {
        user: job.currentUser,
        organizationId: job.organizationId
      })
    })
  }

  return authValidation
}

module.exports = buildAuthValidation

