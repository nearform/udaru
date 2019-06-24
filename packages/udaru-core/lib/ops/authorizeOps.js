'use strict'
/* eslint-disable handle-callback-err */
const async = require('async')
const Boom = require('boom')
const Joi = require('@hapi/joi')
const asyncify = require('../asyncify')
const iam = require('./iam')
const validationRules = require('./validation').authorize
const buildPolicyOps = require('./policyOps')

function badRequestWrap (next) {
  return function (err, result) {
    next(err ? Boom.badRequest(err) : null, result)
  }
}

function badImplementationWrap (next) {
  return function (err, result) {
    next(err ? Boom.badRequest(err) : null, result)
  }
}

function buildContext (params) {
  let context = {
    udaru: {
      userId: params.userId,
      organizationId: params.organizationId
    },
    request: {
      currentTime: new Date().toISOString()
    }
  }

  if (params.sourceIpAddress) {
    context.request.sourceIp = params.sourceIpAddress
    context.request.sourcePort = params.sourcePort
    context.request.source = 'server'
  } else {
    context.request.source = 'api'
  }

  return context
}

function buildAuthorizeOps (db, config) {
  const policyOps = buildPolicyOps(db, config)
  const authorize = {
    /**
     * Return if a user can perform an action on a certain resource
     *
     * @param  {Object}   options { resource, action, userId,  }
     * @param  {Function} cb
     */
    isUserAuthorized: function isUserAuthorized ({ resource, action, userId, organizationId, sourceIpAddress, sourcePort }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      async.waterfall([
        function validate (next) {
          Joi.validate({ resource, action, userId, organizationId }, validationRules.isUserAuthorized, badRequestWrap(next))
        },
        function listPolicies (result, next) {
          policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
        },
        function check (policies, next) {
          let context = buildContext({userId, organizationId, sourceIpAddress, sourcePort})
          next(null, iam(policies).isAuthorized({resource, action, context}))
        }
      ], function (err, access) {
        cb(err, { access })
      })

      return promise
    },

    /**
     * Return if a user can perform an action on a certain resource
     *
     * @param  {Object}   options { resource, action, userId,  }
     * @param  {Function} cb
     */
    batchAuthorization: function batchAuthorization ({ resourceBatch, userId, organizationId, sourceIpAddress, sourcePort }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      async.waterfall([
        function validate (next) {
          Joi.validate({ resourceBatch, userId, organizationId }, validationRules.batchAuthorization, badRequestWrap(next))
        },
        function listPolicies (result, next) {
          policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
        },
        function check (policies, next) {
          let context = buildContext({userId, organizationId, sourceIpAddress, sourcePort})

          resourceBatch.forEach((rb) => {
            rb.access = iam(policies).isAuthorized({resource: rb.resource, action: rb.action, context})
          })
          next(null, resourceBatch)
        }
      ], function (err, access) {
        cb(err, resourceBatch)
      })

      return promise
    },

    /**
     * List all user's actions on a given resource
     *
     * @param  {Object}   options { userId, resource }
     * @param  {Function} cb
     */
    listAuthorizations: function listAuthorizations ({ userId, resource, organizationId, sourceIpAddress, sourcePort }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      async.waterfall([
        function validate (next) {
          Joi.validate({ resource, userId, organizationId }, validationRules.listAuthorizations, badRequestWrap(next))
        },
        function listPolicies (result, next) {
          policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
        },
        function check (policies, next) {
          let context = buildContext({userId, organizationId, sourceIpAddress, sourcePort})
          iam(policies).actions({resource, context}, badImplementationWrap(next))
        }
      ], function (err, actions) {
        cb(err, { actions })
      })

      return promise
    },

    /**
     * List all user's actions on a given list of resources
     *
     * @param  {Object}   options { userId, resources }
     * @param  {Function} cb
     */
    listAuthorizationsOnResources: function listAuthorizationsOnResources ({ userId, resources, organizationId, sourceIpAddress, sourcePort }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      async.waterfall([
        function validate (next) {
          Joi.validate({ userId, resources, organizationId }, validationRules.listAuthorizationsOnResources, badRequestWrap(next))
        },
        function listPolicies (result, next) {
          policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
        },
        function listAuthorizationsOnResources (policies, next) {
          let context = buildContext({userId, organizationId, sourceIpAddress, sourcePort})
          iam(policies).actionsOnResources({ resources, context }, badImplementationWrap(next))
        }
      ], cb)

      return promise
    }
  }

  authorize.isUserAuthorized.validate = validationRules.isUserAuthorized
  authorize.listAuthorizations.validate = validationRules.listAuthorizations
  authorize.listAuthorizationsOnResources.validate = validationRules.listAuthorizationsOnResources
  authorize.batchAuthorization.validate = validationRules.batchAuthorization

  return authorize
}

module.exports = buildAuthorizeOps
