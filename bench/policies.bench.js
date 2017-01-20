'use strict'

module.exports = [
  {
    tag: 'get/policies/{id}',
    handler: () => {
      return {
        path: '/policies/policy-1',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  }
] 