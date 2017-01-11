'use strict'

const Boom = require('boom')

function boomErrorWrapper (next) {
  return function wrapAsBadImplementation (err, result) {
    next(err ? Boom.badImplementation(err) : null, result)
  }
}

module.exports = {
  boomErrorWrapper: boomErrorWrapper
}
