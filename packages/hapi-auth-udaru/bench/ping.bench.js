'use strict'

module.exports = [
  {
    tag: 'GET ping',
    handler: () => {
      return {
        path: '/ping',
        method: 'GET'
      }
    }
  }
]
