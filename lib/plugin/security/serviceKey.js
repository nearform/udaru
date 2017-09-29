'use strict'

function buildServiceKey (config) {
  // We may want to do it registering a plugin and have a mapping for the url that need service keys?
  function hasValidServiceKey (request) {
    let validKeys = config.get('security.api.servicekeys.private')

    return (validKeys.indexOf(!!request.query && request.query.sig) !== -1)
  }

  return {
    hasValidServiceKey
  }
}

module.exports = buildServiceKey
