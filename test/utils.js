'use strict'

const _ = require('lodash')
const config = require('../lib/config/build-all')()
const db = require('./../lib/core/lib/db')(null, config)
const SQL = require('@nearform/sql')

const udaru = require('./../lib/core')()

/**
 * Merge the authorization default header with the provided options
 *
 * @param  {Object} customOptions { method, url, ... }
 * @return {Object}
 */
function requestOptions (customOptions) {
  const defaultOptions = {
    headers: {
      authorization: 'ROOTid',
      org: 'WONKA'
    }
  }

  return Object.assign(defaultOptions, customOptions)
}

function findPick (arr, search, fields) {
  return _.pick(_.find(arr, search), fields)
}

function deleteUserFromAllTeams (id, cb) {
  const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`
  db.query(sqlQuery, cb)
}

function Statement (effect, action, resource) {
  return {
    Statement: [{
      Effect: effect,
      Action: action,
      Resource: resource
    }]
  }
}

function DenyStatement (action, resource) {
  return Statement('Deny', action, resource)
}

function AllowStatement (action, resource) {
  return Statement('Allow', action, resource)
}

module.exports = {
  requestOptions,
  findPick,
  deleteUserFromAllTeams,
  udaru,
  db,
  Statement,
  AllowStatement,
  DenyStatement
}
