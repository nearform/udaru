'use strict'

const Boom = require('boom')
const SQL = require('./../db/SQL')

function boomErrorWrapper (next) {
  return function wrapAsBadImplementation (err, result) {
    next(err ? Boom.badImplementation(err) : null, result)
  }
}

function isUniqueViolationError (err) {
  return err && err.code === '23505'
}

function checkPoliciesOrg (db, policies, organizationId, cb) {
  db.query(SQL`SELECT id FROM policies WHERE id = ANY (${policies}) AND org_id != ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== 0) {
      return cb(Boom.badRequest(`Some policies [${result.rows.map(r => r.id).join(',')}] were not found`))
    }

    cb()
  })
}

function checkUsersOrg (db, users, organizationId, cb) {
  db.query(SQL`SELECT id FROM users WHERE id = ANY (${users}) AND org_id != ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== 0) {
      return cb(Boom.badRequest(`Some users [${result.rows.map(r => r.id).join(',')}] were not found`))
    }

    cb()
  })
}

function checkTeamsOrg (db, teams, organizationId, cb) {
  db.query(SQL`SELECT id FROM teams WHERE id = ANY (${teams}) AND org_id != ${organizationId}`, (err, result) => {
    if (err) return cb(Boom.badImplementation(err))

    if (result.rowCount !== 0) {
      return cb(Boom.badRequest(`Some teams [${result.rows.map(r => r.id).join(',')}] were not found`))
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

module.exports = {
  boomErrorWrapper,
  isUniqueViolationError,
  checkPoliciesOrg,
  checkUsersOrg,
  checkTeamsOrg,
  checkUserOrg
}
