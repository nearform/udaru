'use strict'

module.exports = [
  {
    tag: 'get/access/{userId}/{action}/{resource}',
    handler: () => {
      return {
        path: '/access/user-1/action-1/resource-1',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
] 