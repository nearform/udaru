'use strict'

const _ = require('lodash')
const db = require('./../src/udaru/lib/db')
const SQL = require('./../src/udaru/lib/db/SQL')

const config = require('./../src/hapi-udaru/lib/config')
const udaru = require('./../src/udaru')(config._rawConfig)

/**
 * Merge the authorization default header with the provided options
 *
 * @param  {Object} customOptions { method, url, ... }
 * @return {Object}
 */
function requestOptions (customOptions) {
  const defaultOptions = {
    headers: {
      authorization: 'ROOTid',
      org: 'WONKA'
    }
  }

  return Object.assign(defaultOptions, customOptions)
}

function findPick (arr, search, fields) {
  return _.pick(_.find(arr, search), fields)
}

function deleteUserFromAllTeams (id, cb) {
  const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`
  db.query(sqlQuery, cb)
}

module.exports = {
  requestOptions,
  findPick,
  deleteUserFromAllTeams,
  udaru
}
