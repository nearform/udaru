'use strict'

module.exports = [
  {
    tag: 'GET authorization/list/{userId}/{resource}',
    handler: () => {
      return {
        path: '/authorization/list/ROOTid/resource_a',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
]
