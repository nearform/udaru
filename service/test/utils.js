'use strict'

/**
 * Merge the authorization default header with the provided options
 *
 * @param  {Object} customOptions { method, url, ... }
 * @return {Object}
 */
function requestOptions (customOptions) {
  const defaultOptions = {
    headers: {
      authorization: 1,
      org: 'WONKA'
    }
  }

  return Object.assign(defaultOptions, customOptions)
}

module.exports = {
  requestOptions: requestOptions
}
