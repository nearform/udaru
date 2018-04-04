'use strict'

module.exports = [
  {
    tag: 'GET authorization/teams',
    handler: () => {
      return {
        path: '/authorization/teams?page=1&limit=100',
        method: 'GET',
        headers: {
          authorization: 'ROOTid',
          org: 'WONKA'
        }
      }
    }
  }
]
