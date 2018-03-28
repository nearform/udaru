'use strict'

const _ = require('lodash')

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

function Statement (effect, action, resource) {
  return {
    Statement: [{
      Effect: effect,
      Action: action,
      Resource: resource
    }]
  }
}

function StatementWithCondition (effect, action, resource, condition) {
  let statement = Statement(effect, action, resource)
  statement.Statement[0].Condition = condition
  return statement
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
  Statement,
  StatementWithCondition,
  AllowStatement,
  DenyStatement
}
