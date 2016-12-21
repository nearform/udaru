'use strict'

const async = require('async')

const authConfig = require('./lib/config.auth')

const UserOps = require('./lib/userOps')
const PolicyOps = require('./lib/policyOps')
const AuthorizeOps = require('./lib/authorizeOps')

module.exports = (options, server, request, userId, callback) => {
  const { route } = request

  const resourceType = route.path.split('/')[2]
  if (!authConfig.resources[resourceType]) {
    return callback(null, false, { error: 'Resource builder not found' })
  }

  const userOps = UserOps(options.dbPool, server.logger)

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
      const authPlugin = route.settings.plugins && route.settings.plugins.auth
      if (!authPlugin) {
        return next(null, false)
      }

      const requestParams = authPlugin.getParams ? authPlugin.getParams(request) : {}
      const buildParams = Object.assign({}, user, requestParams)

      const resourceBuilder = authConfig.resources[resourceType]
      const resource = resourceBuilder && resourceBuilder(buildParams) || null

      const params = {
        userId,
        action: authPlugin.action,
        resource
      }

      const authorize = AuthorizeOps(PolicyOps(options.dbPool))
      authorize.isUserAuthorized(params, (error, result) => {
        if (error) {
          return next(error)
        }

        next(null, result.access, user)
      })

    }
  ], callback)
}
