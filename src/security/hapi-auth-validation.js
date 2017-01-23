'use strict'

const async = require('async')

const authConfig = require('./../lib/config/config.auth')

const userOps = require('./../lib/ops/userOps')
const authorizeOps = require('./../lib/ops/authorizeOps')


function authorize (userId, action, resource, done) {
  const params = { userId, action, resource }

  authorizeOps.isUserAuthorized(params, (err, result) => {
    if (err) {
      return done(err)
    }

    done(null, result.access)
  })
}

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
    (currentUser, next) => {
      const { route } = request

      const authPlugin = route.settings.plugins && route.settings.plugins.auth
      if (!authPlugin) {
        return next(null, false)
      }

      const requestParams = authPlugin.getParams ? authPlugin.getParams(request) : {}
      const buildParams = Object.assign({}, { organizationId: currentUser.organizationId }, requestParams)

      let resource = authPlugin.resource
      if (!resource) {
        const resourceType = route.path.split('/')[2]
        if (!authConfig.resources[resourceType]) {
          return next(null, false, { error: 'Resource builder not found' })
        }

        const resourceBuilder = authConfig.resources[resourceType]

        if (resourceType === 'users' && buildParams.userId) {
          buildParams.teamId = '*'
          const resources = [resourceBuilder(buildParams)]

          return userOps.readUser({ id: buildParams.userId, organizationId: buildParams.organizationId }, (err, user) => {
            if (err && err.output.statusCode === 404) return proceed(resources)
            if (err) return next(err)

            user.teams.forEach((team) => {
              buildParams.teamId = team.id
              resources.push(resourceBuilder(buildParams))
            })

            proceed(resources)
          })
        }

        resource = resourceBuilder && resourceBuilder(buildParams) || null
      }

      proceed([resource])

      function proceed (resources) {
        async.any(resources, async.apply(authorize, userId, authPlugin.action), (err, valid) => {
          next(err, valid, currentUser)
        })
      }

    }
  ], callback)
}
