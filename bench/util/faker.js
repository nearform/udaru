'use strict'

module.exports = function () {
  var index = 1

  function generate (tag) {
    index = index + 1
    tag = tag || 'misc'
    return `${tag.toUpperCase()}-${index}`
  }

  return generate
}