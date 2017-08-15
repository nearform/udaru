'use strict'
/* eslint-disable handle-callback-err */
const async = require('async')
const Boom = require('boom')
const Joi = require('joi')
const iam = require('./iam')
const validationRules = require('./validation').authorize
const policyOps = require('./policyOps')

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

const authorize = {
  /**
   * Return if a user can perform an action on a certain resource
   *
   * @param  {Object}   options { resource, action, userId,  }
   * @param  {Function} cb
   */
  isUserAuthorized: function isUserAuthorized ({ resource, action, userId, organizationId }, cb) {
    async.waterfall([
      function validate (next) {
        Joi.validate({ resource, action, userId, organizationId }, validationRules.isUserAuthorized, badRequestWrap(next))
      },
      function listPolicies (result, next) {
        policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
      },
      function check (policies, next) {
        iam(policies).isAuthorized({ resource, action }, badImplementationWrap(next))
      }
    ], function (err, access) {
      cb(err, { access })
    })
  },

  /**
   * List all user's actions on a given resource
   *
   * @param  {Object}   options { userId, resource }
   * @param  {Function} cb
   */
  listAuthorizations: function listAuthorizations ({ userId, resource, organizationId }, cb) {
    async.waterfall([
      function validate (next) {
        Joi.validate({ resource, userId, organizationId }, validationRules.listAuthorizations, badRequestWrap(next))
      },
      function listPolicies (result, next) {
        policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
      },
      function check (policies, next) {
        iam(policies).actions({ resource }, badImplementationWrap(next))
      }
    ], function (err, actions) {
      cb(err, { actions })
    })
  },

  /**
   * List all user's actions on a given list of resources
   *
   * @param  {Object}   options { userId, resources }
   * @param  {Function} cb
   */
  listAuthorizationsOnResources: function listAuthorizationsOnResources ({ userId, resources, organizationId }, cb) {
    async.waterfall([
      function validate (next) {
        Joi.validate({ userId, resources, organizationId }, validationRules.listAuthorizationsOnResources, badRequestWrap(next))
      },
      function listPolicies (result, next) {
        policyOps.listAllUserPolicies({ userId, organizationId }, badImplementationWrap(next))
      },
      function listAuthorizationsOnResources (policies, next) {
        iam(policies).actionsOnResources({ resources }, badImplementationWrap(next))
      }
    ], cb)
  }
}

authorize.isUserAuthorized.validate = validationRules.isUserAuthorized
authorize.listAuthorizations.validate = validationRules.listAuthorizations
authorize.listAuthorizationsOnResources.validate = validationRules.listAuthorizationsOnResources

module.exports = authorize
