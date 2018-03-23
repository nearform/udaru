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
  },
  {
    tag: 'GET authorization/list/{userId}/{resource}',
    handler: () => {
      return {
        path: '/authorization/list/ROOTid/resource-a',
        method: 'GET',
        headers: {
          authorization: 'ROOTid'
        }
      }
    }
  },
  {
    tag: 'GET authorization/list/{userId}',
    handler: () => {
      return {
        path: '/authorization/list/ManyPoliciesId?resources=/myapp/users/filippo&resources=/myapp/documents/no_access&resources=/myapp/teams/foo&resources=/myapp/teams/foo1&resources=/myapp/teams/foo2&resources=/myapp/teams/foo3&resources=/myapp/teams/foo4&resources=/myapp/teams/foo5&resources=/myapp/teams/foo6&resources=/myapp/teams/foo7',
        method: 'GET',
        headers: {
          authorization: 'ROOTid',
          org: 'WONKA'
        }
      }
    }
  }
]
