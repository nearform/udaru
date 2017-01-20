'use strict'

module.exports = [
  {
    tag: 'get/teams',
    handler: () => {
      return {
        path: '/teams',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
] 