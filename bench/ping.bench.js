'use strict'

module.exports = [
  {
    tag: 'get/ping',
    handler: () => {
      return {
        path: '/ping',
        method: 'GET'
      }
    }
  }
] 