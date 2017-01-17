'use strict'

const Boom = require('boom')

function boomErrorWrapper (next) {
  return function wrapAsBadImplementation (err, result) {
    next(err ? Boom.badImplementation(err) : null, result)
  }
}

function isUniqueViolationError (err) {
  return err && err.code === '23505'
}

module.exports = {
  boomErrorWrapper: boomErrorWrapper,
  isUniqueViolationError: isUniqueViolationError
}
