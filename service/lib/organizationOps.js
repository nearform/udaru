'use strict'

const Boom = require('boom')
const async = require('async')
const dbUtil = require('./dbUtil')
const PolicyOps = require('./policyOps')

module.exports = function (dbPool, log) {
  const policyOps = PolicyOps(dbPool)

  function insertOrganization (job, next) {
    let params = [job.params.id, job.params.name, job.params.description]

    job.client.query('INSERT INTO organizations (id, name, description) VALUES ($1, $2, $3) RETURNING id', params, (err, res) => {
      if (err) return next(err)
      job.organization = res.rows[0]
      next()
    })
  }

  function createDefaultPolicies (job, next) {
    policyOps.createOrgDefaultPolicies(job.client, job.organization.id, function (err, id) {
      if (err) return next(err)
      job.adminPolicyId = id
      next()
    })
  }

  /**
   * Insert a new user and attach to it the organization admin policy
   *
   * NOTE: we are not using userOps.createUser because we need to execute this operation in a transaction with the same client.
   *
   * @param  {Object}   job
   * @param  {Function} next
   */
  function insertOrgAdminUser (job, next) {
    if (job.user) {
      job.client.query('INSERT INTO users (id, name, org_id) VALUES (DEFAULT, $1, $2) RETURNING id', [job.user.name, job.organization.id], (err, res) => {
        if (err) return next(err)
        job.user.id = res.rows[0].id

        job.client.query('INSERT INTO user_policies (user_id, policy_id) VALUES ($1, $2)', [job.user.id, job.adminPolicyId], next)
      })

      return
    }

    next()
  }

  var organizationOps = {

    /**
     * Fetch all organizations
     *
     * @param  {Object}   args
     * @param  {Function} cb
     */
    list: function list (args, cb) {
      dbPool.query('SELECT id, name, description FROM organizations ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * Creates a new organization
     *
     * @param  {Object}   params {id, name, description}
     * @param  {Object}   opts { createOnly }
     * @param  {Function} cb
     */
    create: function create (params, opts, cb) {
      if (!cb) {
        cb = opts
        opts = {}
      }

      const { createOnly } = opts

      const tasks = [
        (job, next) => {
          job.params = params
          job.user = params.user
          next()
        },
        insertOrganization
      ]
      if (!createOnly) {
        tasks.push(
          createDefaultPolicies,
          insertOrgAdminUser
        )
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) return cb(Boom.badImplementation(err))

        organizationOps.readById(res.organization.id, (err, organization) => {
          if (err) return cb(Boom.badImplementation(err))

          cb(null, { organization, user: res.user })
        })
      })
    },

    /**
     * Fetch data for an organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    readById: function readById (id, cb) {
      dbPool.query('SELECT id, name, description FROM organizations WHERE id = $1', [id], function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, result.rows[0])
      })
    },

    /**
     * Delete organization
     *
     * @param  {String}   id
     * @param  {Function} cb
     */
    deleteById: function deleteById (id, cb) {
      const tasks = []
      let usersParams = []
      dbPool.connect(function (err, client, done) {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((res, next) => {
          client.query('SELECT id FROM users WHERE org_id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(null, [])

            usersParams = result.rows.map(r => r.id)
            next(null, usersParams)
          })
        })
        tasks.push((res, next) => {
          if (usersParams.length === 0) return next(null, res)

          client.query('DELETE FROM team_members WHERE user_id = ANY($1::int[])', [usersParams], next)
        })
        tasks.push((res, next) => {
          if (usersParams.length === 0) return next(null, res)

          client.query('DELETE FROM user_policies WHERE user_id = ANY($1::int[])', [usersParams], next)
        })
        tasks.push((res, next) => {
          client.query('SELECT id FROM teams WHERE org_id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(null, [])

            next(null, result.rows.map(r => r.id))
          })
        })
        tasks.push((res, next) => {
          if (res.length === 0) return next(null, res)

          client.query('DELETE FROM team_policies WHERE team_id  = ANY($1::int[])', [res], next)
        })
        tasks.push((res, next) => { client.query('DELETE FROM policies WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => { client.query('DELETE FROM teams WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => { client.query('DELETE FROM users WHERE org_id = $1', [id], next) })
        tasks.push((res, next) => {
          client.query('DELETE FROM organizations WHERE id = $1', [id], function (err, result) {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            next(null, result)
          })
        })
        tasks.push((res, next) => { client.query('COMMIT', next) })

        async.waterfall(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null)
        })
      })
    },

    /**
     * Updates all (for now) organization properties
     *
     * @param  {Object}   args {id, name, description}
     * @param  {Function} cb
     */
    update: function update (args, cb) {
      let params = [args.id, args.name, args.description]

      dbPool.query('UPDATE organizations SET name = $2, description = $3 WHERE id = $1', params, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))
        if (result.rowCount === 0) return cb(Boom.notFound())

        return cb(null, {id: args.id, name: args.name, description: args.description})
      })
    }
  }

  return organizationOps
}
