'use strict'

/**
 * Calls the callback with an error when the `connect` function is executed
 */
function getDbPollConnectionError () {
  return {connect: function (cb) {
    cb(new Error('connection error test'))
  }}
}

/**
 * Calls the callback with an error when the `query` function is executed
 */
function getDbPollFirstQueryError () {
  return {connect: function (cb) {
    var client = {query: (sql, params, cb) => {
      cb = cb || params
      cb(new Error('query error test'))
    }}
    cb(undefined, client, () => {})
  }}
}

/**
 * Calls the callback with an error when the query starting with `startsWith` should be executed.
 *
 * If `startsWith` is `undefined` the `query` will always return the `result` object.
 *
 * Note: the `result` object is returned for all the `query` invocations in which `startsWith` is not matched.
 *
 * To test the `ROLLBACK` call, you will need to increase `t.plan` by one and pass the `options.testRollback` as true
 * along with the test object `t`.
 *
 * @param  {String} startsWith
 * @param  {Object} result
 */
function getDbPoolErrorForQueryOrRowCount (startsWith, options = {testRollback: false, expect: undefined}, result = {rowCount: 1, rows: []}) {
  return {connect: function (cb) {
    var client = {query: (sql, params, cb) => {
      cb = cb || params
      if (sql.startsWith(startsWith)) {
        return cb(new Error('query error test'))
      }
      if (options.testRollback && sql.startsWith('ROLLBACK')) {
        options.expect(sql).to.equal('ROLLBACK')
      }
      cb(undefined, result)
    }}
    cb(undefined, client, () => {})
  }}
}

/**
 * Helper method fot testing that the callback is called with an `err` object with a specific message
 *
 * @param  {Object} t
 * @param  {String} errorString
 */
function testError (expect, errorString, cb) {
  return (err, result) => {
    expect(err).to.exist()
    expect(result).to.not.exist()
    expect(err.message).to.equal(errorString)

    cb()
  }
}

module.exports = {
  getDbPollConnectionError: getDbPollConnectionError,
  getDbPollFirstQueryError: getDbPollFirstQueryError,
  getDbPoolErrorForQueryOrRowCount: getDbPoolErrorForQueryOrRowCount,
  testError: testError
}
