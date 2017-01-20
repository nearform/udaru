'use strict'

module.exports = [
                          {
    tag: 'get/users',
    handler: () => {
      return {
        path: '/users',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
] 