'use strict'
/* eslint-disable handle-callback-err */
const Boom = require('boom')
const Joi = require('joi')
const iam = require('iam-js')
const validationRules = require('./validation').authorize

function AuthorizeOps (policyOps) {
  const authorize = {
    /**
     * Return if a user can perform an action on a certain resource
     *
     * @param  {Object}   options { resource, action, userId,  }
     * @param  {Function} cb
     */
    isUserAuthorized: function isUserAuthorized ({ resource, action, userId, organizationId }, cb) {
      Joi.validate({ resource, action, userId, organizationId }, validationRules.isUserAuthorized, function (err) {
        if (err) return cb(Boom.badRequest(err))

        policyOps.listAllUserPolicies({ userId, organizationId }, (err, policies) => {
          if (err) {
            return cb(err)
          }

          iam(policies, ({ process }) => {
            process(resource, action, (err, access) => {
              if (err) {
                return cb(err)
              }

              cb(null, { access })
            })
          })
        })
      })
    },

    /**
     * List all user's actions on a given resource
     *
     * @param  {Object}   options { userId, resource }
     * @param  {Function} cb
     */
    listAuthorizations: function listAuthorizations ({ userId, resource, organizationId }, cb) {
      Joi.validate({ resource, userId, organizationId }, validationRules.listAuthorizations, function (err) {
        if (err) return cb(Boom.badRequest(err))

        policyOps.listAllUserPolicies({ userId, organizationId }, (err, policies) => {
          if (err) return cb(Boom.wrap(err))

          iam(policies, ({ actions }) => {
            actions(resource, (err, result) => {
              if (err) return cb(err)

              cb(null, { actions: result })
            })
          })
        })
      })
    }
  }

  authorize.isUserAuthorized.validate = validationRules.isUserAuthorized
  authorize.listAuthorizations.validate = validationRules.listAuthorizations

  return authorize
}

module.exports = AuthorizeOps
