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

module.exports = {
  requestOptions,
  findPick
}
