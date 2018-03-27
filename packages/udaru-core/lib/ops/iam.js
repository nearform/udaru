'use strict'

const PBAC = require('pbac')
const _ = require('lodash')
const asyncify = require('../asyncify')

module.exports = function (policies) {
  const pbac = new PBAC(policies)

  function isAuthorized (params) {
    return pbac.evaluate(params)
  }

  function actions ({ resource, context }, done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    try {
      const result = _(policies)
        .map('Statement')
        .flatten()
        .filter({Effect: 'Allow'})
        .map((statement) => {
          let actions = []
          statement.Resource.forEach((r) => {
            if (pbac.conditions.StringLike(resource, r)) {
              statement.Action.forEach((action) => {
                if (isAuthorized({resource, action, context})) {
                  actions.push(action)
                }
              })
            }
          })

          return actions.length > 0 ? actions : null
        })
        .filter()
        .flatten()
        .uniq()
        .value()

      done(null, result)
    } catch (e) {
      done(e)
    }

    return promise
  }

  function actionsOnResources ({ resources, context }, done) {
    let promise = null
    if (typeof done !== 'function') [promise, done] = asyncify()

    try {
      const resultMap = {}

      const statements = _(policies).reduce((statements, policy) => {
        return _.concat(statements, policy.Statement)
      }, [])

      resources.forEach((resource) => {
        resultMap[resource] = []
        statements.forEach((statement) => {
          if (statement.Effect === 'Allow') {
            statement.Resource.forEach((r) => {
              if (pbac.conditions.StringLike(resource, r)) {
                statement.Action.forEach((action) => {
                  if (isAuthorized({resource, action, context})) {
                    resultMap[resource].push(action)
                  }
                })
              }
            })
          }
        })
        resultMap[resource] = _.uniq(resultMap[resource])
      })

      let result = _(resultMap)
        .reduce((result, actions, resource) => {
          result.push({resource, actions})
          return result
        }, [])

      done(null, result)
    } catch (e) {
      done(e)
    }

    return promise
  }

  return {
    isAuthorized: isAuthorized,
    actions: actions,
    actionsOnResources: actionsOnResources
  }
}
