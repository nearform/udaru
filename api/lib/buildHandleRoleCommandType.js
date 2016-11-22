'use strict'

function buildHandleRoleCommandType (mu) {
  return function handleRoleCommandType (role, cmd, type, params, request, reply) {
    mu.dispatch({ role, cmd, type, params }, function (err, res) {
      if (err) {
        return reply(err)
      }

      return reply(res)
    })
  }
}

module.exports = buildHandleRoleCommandType
