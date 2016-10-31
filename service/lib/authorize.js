'use strict'
/* eslint-disable handle-callback-err */
const iam = require('iam-js')
const policyOps = require('./policyOps')

/*
* Auth.canDo(user policy set, resource, action) returns "allow" or "deny"
*/
function isUserAuthorized (pool, { resource, action, userId }, cb) {
  policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
    if (err) {
      return cb(err)
    }

    iam(policies, ({ process }) => {
      process(resource, action, (err, access) => {
        if (err) return cb(err)

        cb(null, { access })
      })
    })
  })
}

function listAuthorizations (pool, {userId, resource}, cb) {
  const data = []
  var actions = []
  // build the set of actions in the user's policy set
  // can't check per resource as requires wildcard processing
  policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
    policies.forEach(p => {
      p.Statement.forEach(s => {
        s.Action.forEach(a => {
          actions.push(a)
        })
      })
    })
    actions = Array.from(new Set(actions)) // dedupe
    // check each action aginst the resource for this user
    actions.forEach(action => {
      iam(policies, ({ process }) => {
        process(resource, action, (err, access) => {
          if (err) return cb(err)
          if (access) {
            data.push(action)
          }
        })
      })
    })
    // return teh allowable actions
    cb(null, {actions: data})
  })
}

//
// TODO: Note: this needs to deal with wildcards.
// would be worth looking into the pbac module code for reuse opportunity
//
function listAuthorizations2 (pool, {userId, resource}, cb) {
  var data = {}

  policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
    policies.forEach(p => {
      p.Statement.forEach(s => {
        s.Action.forEach(a => {
          if (s.Resource.indexOf(resource) > -1) {
            if (!data[a] || data[a] === 'Allow') {
              data[a] = s.Effect
            }
          }
        })
      })
    })
    data = filterObject(data)
    cb(null, {actions: Object.getOwnPropertyNames(data)})
  })
}

// TODO: consider using lodash pick for this
function filterObject (obj) {
  var filtered = {}
  for (var i in obj) {
    if (obj[i] === 'Allow') filtered[i] = obj[i]
  }
  return filtered
}

// function listAuthorizations (pool, {userId, resource}, cb) {
//   const data = {}
//
//   policyOps.listAllUserPolicies(pool, { userId }, (err, policies) => {
//     policies.forEach(p => {
//       p.Statement.forEach(s => {
//         s.Action.forEach(a => {
//           if (s.Resource.indexOf(resource) > -1) {
//             if (!data[a] || data[a] === 'Allow') {
//               data[a] = s.Effect
//             }
//           }
//         })
//       })
//     })
//     cb(null, {actions: Object.getOwnPropertyNames(data)})
//   })
// }
//
module.exports = {
  isUserAuthorized: isUserAuthorized,
  listAuthorizations: listAuthorizations
}
