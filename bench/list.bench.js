'use strict'

module.exports = [
  {
    tag: 'get/list/{userId}/{resource}',
    handler: () => {
      return {
        path: '/list/user-1/resource-1',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
] 