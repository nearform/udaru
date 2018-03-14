'use strict'

const _ = require('lodash')
const Boom = require('boom')
const SQL = require('@nearform/sql')

function boomErrorWrapper (next) {
  return function wrapAsBadImplementation (err, result) {
    if (err && err.isBoom) {
      return next(err)
    }

    next(err ? Boom.badImplementation(err) : null, result)
  }
}

function isUniqueViolationError (err) {
  return err && err.code === '23505'
}

function isForeignKeyViolationError (err) {
  return err && err.code === '23503'
}

function checkPoliciesOrg (db, policies, organizationId, cb) {
  const policyIds = _.uniq(_.map(policies, 'id'))

  db.query(SQL`SELECT id FROM policies WHERE id = ANY (${policyIds}) AND (org_id = ${organizationId} OR org_id IS NULL)`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== policyIds.length) {
      return cb(Boom.badRequest(`Some policies [${_.difference(policyIds, result.rows.map(r => r.id))}] were not found`))
    }

    cb()
  })
}

function checkUsersOrg (db, users, organizationId, cb) {
  db.query(SQL`SELECT id FROM users WHERE id = ANY (${users}) AND org_id = ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== users.length) {
      return cb(Boom.badRequest(`Some users [${_.difference(users, result.rows.map(r => r.id))}] were not found`))
    }

    cb()
  })
}

function checkTeamsOrg (db, teams, organizationId, cb) {
  db.query(SQL`SELECT id FROM teams WHERE id = ANY (${teams}) AND org_id = ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== teams.length) {
      return cb(Boom.badRequest(`Some teams [${_.difference(teams, result.rows.map(r => r.id))}] were not found`))
    }

    cb()
  })
}

function checkUserOrg (db, id, organizationId, cb) {
  db.query(SQL`SELECT id FROM users WHERE id = ${id} AND org_id = ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== 1) {
      return cb(Boom.badRequest(`User ${id} not found`))
    }

    cb()
  })
}

function checkOrg (db, organizationId, cb) {
  db.query(SQL`SELECT id FROM organizations WHERE id = ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== 1) {
      return cb(Boom.badRequest(`Organization ${organizationId} not found`))
    }

    cb()
  })
}

function preparePolicy (policy) {
  if (_.isString(policy)) {
    return {
      id: policy,
      variables: {}
    }
  }

  policy.variables = policy.variables || {}

  return policy
}

function preparePolicies (policies) {
  return _.map(policies, preparePolicy)
}

module.exports = {
  preparePolicies,
  boomErrorWrapper,
  isUniqueViolationError,
  isForeignKeyViolationError,
  checkPoliciesOrg,
  checkUsersOrg,
  checkTeamsOrg,
  checkUserOrg,
  checkOrg
}
