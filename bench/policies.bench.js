'use strict'

module.exports = [
  {
    tag: 'GET authorization/policies',
    handler: () => {
      return {
        path: '/authorization/policies?page=1&limit=100',
        method: 'GET',
        headers: {
          authorization: 'ROOTid',
          org: 'WONKA'
        }
      }
    }
  }
]
