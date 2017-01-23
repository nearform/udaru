'use strict'

module.exports = [
  {
    tag: 'GET authorization/access/{userId}/{action}/{resource}',
    handler: () => {
      return {
        path: '/authorization/access/ROOTid/action-a/resource-a',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
]
