'use strict'

const async = require('async')

const authConfig = require('./lib/config/config.auth')

const userOps = require('./lib/ops/userOps')
const authorize = require('./lib/ops/authorizeOps')

module.exports = (options, server, request, userId, callback) => {
  async.waterfall([
    (next) => {
      userOps.getUserOrganizationId(userId, (error, organizationId) => {
        if (error) {
          return next({ message: 'Bad credentials' })
        }

        next(null, organizationId)
      })
    },
    (organizationId, next) => {
      userOps.readUser({ id: userId, organizationId }, (error, user) => {
        if (error) {
          return next({ message: 'Bad credentials' })
        }

        next(null, user)
      })
    },
    (user, next) => {
      const { route } = request

      const authPlugin = route.settings.plugins && route.settings.plugins.auth
      if (!authPlugin) {
        return next(null, false)
      }

      const requestParams = authPlugin.getParams ? authPlugin.getParams(request) : {}
      const buildParams = Object.assign({}, user, requestParams)

      let resource = authPlugin.resource
      if (!resource) {
        const resourceType = route.path.split('/')[2]
        if (!authConfig.resources[resourceType]) {
          return callback(null, false, { error: 'Resource builder not found' })
        }

        const resourceBuilder = authConfig.resources[resourceType]
        resource = resourceBuilder && resourceBuilder(buildParams) || null
      }

      const params = {
        userId,
        action: authPlugin.action,
        resource
      }

      authorize.isUserAuthorized(params, (error, result) => {
        if (error) {
          return next(error)
        }

        next(null, result.access, user)
      })

    }
  ], callback)
}
