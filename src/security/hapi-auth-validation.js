'use strict'

const async = require('async')
const Boom = require('boom')

const config = require('./../lib/config')
const authConfig = require('./../lib/config/config.auth')
const userOps = require('./../lib/ops/userOps')
const authorizeOps = require('./../lib/ops/authorizeOps')

function canImpersonate (user) {
  return user.organizationId === config.get('authorization.superUser.organization.id')
}

function loadUser (job, next) {
  const { userId } = job

  userOps.getUserOrganizationId(userId, (err, organizationId) => {
    if (err) return next(Boom.unauthorized('Bad credentials'))

    userOps.readUser({ id: userId, organizationId }, (err, user) => {
      if (err) return next(Boom.unauthorized('Bad credentials'))
      job.currentUser = user

      next()
    })
  })
}

function impersonate (job, next) {
  const { currentUser } = job
  job.organizationId = currentUser.organizationId

  if (canImpersonate(currentUser) && job.requestedOrganizationId) {
    job.organizationId = job.requestedOrganizationId
  }

  next()
}

function checkAuthorization (userId, action, resource, done) {
  const params = { userId, action, resource }

  authorizeOps.isUserAuthorized(params, (err, result) => {
    if (err) return done(err)
    done(null, result.access)
  })
}

function buildResourcesForUser (builder, userId, organizationId, done) {
  const buildParams = {
    userId,
    teamId: '*',
    organizationId
  }

  const resources = [builder(buildParams)]

  userOps.readUser({ id: userId, organizationId: organizationId }, (err, user) => {
    if (err && err.output.statusCode === 404) return done(null, resources)
    if (err) return done(err)

    user.teams.forEach((team) => {
      buildParams.teamId = team.id
      resources.push(builder(buildParams))
    })

    done(null, resources)
  })
}

function buildResources (authParams, request, organizationId, done) {
  let resource = authParams.resource

  if (resource) {
    return done(null, [resource])
  }

  const resourceType = request.route.path.split('/')[2]
  const resourceBuilder = authConfig.resources[resourceType]

  if (!resourceBuilder) {
    return done(new Error('Resource builder not found'))
  }

  const requestParams = authParams.getParams ? authParams.getParams(request) : {}
  const buildParams = Object.assign({}, { organizationId }, requestParams)

  if (resourceType === 'users' && buildParams.userId) {
    return buildResourcesForUser(resourceBuilder, buildParams.userId, organizationId, done)
  }

  done(null, [resourceBuilder(buildParams)])
}

function authorize (job, next) {
  buildResources(job.authParams, job.request, job.organizationId, (err, resources) => {
    if (err) return Boom.unauthorized('Bad credentials')

    const action = job.authParams.action
    const userId = job.currentUser.id

    async.any(resources, async.apply(checkAuthorization, userId, action), (err, valid) => {
      if (err) return next(Boom.forbidden('Invalid credentials', 'udaru'))
      if (!valid) return next(Boom.forbidden('Invalid credentials', 'udaru'))

      next()
    })
  })
}

module.exports = (options, server, request, userId, callback) => {
  const authParams = request.route.settings.plugins && request.route.settings.plugins.auth

  if (!authParams) {
    return callback(Boom.forbidden('Invalid credentials', 'udaru'))
  }

  const job = {
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
