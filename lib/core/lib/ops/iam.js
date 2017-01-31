'use strict'

const PBAC = require('pbac')
const _ = require('lodash')

module.exports = function (policies) {
  const pbac = new PBAC(policies)

  function isAuthorized (params, done) {
    return done(null, pbac.evaluate(params))
  }

  function actions ({ resource }, done) {
    try {
      const result = _(policies)
        .map('Statement')
        .flatten()
        .filter({Effect: 'Allow'})
        .map((statement) => {
          let actions = []
          statement.Resource.forEach((r) => {
            if (pbac.conditions.StringLike(r, resource)) {
              statement.Action.forEach((action) => {
                isAuthorized({ resource, action }, (err, access) => {
                  if (err) return
                  if (access) actions.push(action)
                })
              })
            }
          })

          return actions.length > 0 ? actions : null
        })
        .filter()
        .flatten()
        .uniq()
        .value()

      return done(null, result)
    } catch (e) {
      return done(e)
    }
  }

  return {
    isAuthorized: isAuthorized,
    actions: actions
  }
}
