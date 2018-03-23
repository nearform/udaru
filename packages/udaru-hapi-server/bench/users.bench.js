'use strict'

module.exports = [
  {
    tag: 'GET authorization/users',
    handler: () => {
      return {
        path: '/authorization/users?page=1&limit=100',
        method: 'GET',
        headers: {
          authorization: 'ROOTid',
          org: 'WONKA'
        }
      }
    }
  }
]
