'use strict'

const getProperty = require('lodash/get')

function buildServiceKey (config) {
  // We may want to do it registering a plugin and have a mapping for the url that need service keys?
  function hasValidServiceKey (request) {
    const validKeys = config.get('security.api.servicekeys.private')

    return validKeys.includes(getProperty(request, 'query.sig', ''))
  }

  return {
    hasValidServiceKey
  }
}

module.exports = buildServiceKey
