'use strict'

const Boom = require('boom')
const dbUtil = require('./dbUtil')
const SQL = dbUtil.SQL
const async = require('async')
const PolicyOps = require('./policyOps')
const UserOps = require('./userOps')

function getId (obj) {
  return obj.id
}

module.exports = function (dbPool, log) {
  const policyOps = PolicyOps(dbPool)
  const userOps = UserOps(dbPool)

  function getId (obj) {
    return obj.id
  }

  function insertTeam (job, next) {
    const args = [job.params.name, job.params.description, job.params.parentId, job.params.organizationId]
    job.client.query('INSERT INTO teams (id, name, description, team_parent_id, org_id) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING id', args, (err, res) => {
      if (err) return next(err)
      job.team = res.rows[0]
      next()
    })
  }

  function createDefaultPolicies (job, next) {
    policyOps.createTeamDefaultPolicies(job.client, job.params.organizationId, job.team.id, (err, res) => {
      if (err) return next(err)
      job.policyIds = res.rows.map(getId)
      next()
    })
  }

  function createDefaultUser (job, next) {
    if (!job.params.user) return next()

    userOps.insertUser(job.client, job.params.user.name, job.params.organizationId, (err, user) => {
      if (err) return next(err)

      job.user = user.rows[0]
      next()
    })
  }

  function assignDefaultUserToTeam (job, next) {
    if (!job.user) return next()

    job.client.query(SQL`INSERT INTO team_members (team_id, user_id) VALUES (${job.team.id}, ${job.user.id})`, next)
  }

  function makeDefaultUserAdmin (job, next) {
    if (!job.user) return next()

    const sql = dbUtil.buildInsertStmt('INSERT INTO user_policies (user_id, policy_id) VALUES ', job.policyIds.map((policyId) => [job.user.id, policyId]))
    job.client.query(sql.statement, sql.params, next)
  }

  function deleteTeam (job, next) {
    job.client.query(SQL`DELETE from teams WHERE id = ${job.teamId}`, (err, result) => {
      if (err) return next(err)
      if (result.rowCount === 0) return next(Boom.notFound())
      next()
    })
  }

  function deleteTeamPolicies (job, next) {
    job.client.query(SQL`DELETE FROM team_policies WHERE team_id = ${job.teamId}`, next)
  }

  function deleteTeamMembers (job, next) {
    job.client.query(SQL`DELETE FROM team_members WHERE team_id = ${job.teamId}`, next)
  }

  function readDefaultPoliciesIds (job, next) {
    policyOps.readTeamDefaultPolicies(job.client, job.organizationId, job.teamId, function (err, res) {
      if (err) return next(err)
      job.policies = res.rows.map(getId)
      next()
    })
  }

  function deleteDefaultPolicies (job, next) {
    policyOps.deleteAllPolicyByIds(job.client, job.policies, next)
  }

  var teamOps = {
    /*
     * no query args (but may e.g. sort in future)
     */
    listAllTeams: function listAllTeams (args, cb) {
      dbPool.query('SELECT  id, name, description from teams ORDER BY UPPER(name)', function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /*
     * $1 = org_id
     */
    listOrgTeams: function listOrgTeams (args, cb) {
      dbPool.query('SELECT  id, name, description from teams WHERE org_id = $1 ORDER BY UPPER(name)', args, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * Creates a new team
     *
     * @param  {Object}   params { name, description, parentId, organizationId }
     * @param  {Object}   opts { createOnly }
     * @param  {Function} cb
     */
    createTeam: function createTeam (params, opts, cb) {
      if (!cb) {
        cb = opts
        opts = {}
      }

      const { createOnly } = opts
      const tasks = [
        (job, next) => {
          job.params = params
          next()
        },
        insertTeam
      ]
      if (!createOnly) {
        tasks.push(
          createDefaultPolicies,
          createDefaultUser,
          makeDefaultUserAdmin,
          assignDefaultUserToTeam
        )
      }

      dbUtil.withTransaction(dbPool, tasks, (err, res) => {
        if (err) return cb(Boom.badImplementation(err))

        teamOps.readTeamById([res.team.id], cb)
      })
    },

    /*
     * $1 = id
     */
    readTeamById: function readTeamById (args, cb) {
      const team = {
        'id': null,
        'name': null,
        'description': null,
        users: [],
        policies: []
      }
      const tasks = []

      dbPool.connect((err, client, done) => {
        if (err) return cb(Boom.badImplementation(err))

        tasks.push((next) => {
          client.query('SELECT id, name, description from teams WHERE id = $1', args, (err, result) => {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            team.id = result.rows[0].id
            team.name = result.rows[0].name
            team.description = result.rows[0].description
            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT users.id, users.name from team_members mem, users WHERE mem.team_id = $1 and mem.user_id = users.id ORDER BY UPPER(users.name)', args, function (err, result) {
            if (err) return next(err)

            result.rows.forEach(function (row) {
              team.users.push(row)
            })
            next()
          })
        })

        tasks.push((next) => {
          client.query('SELECT pol.id, pol.name, pol.version from team_policies tpol, policies pol WHERE tpol.team_id = $1 and tpol.policy_id = pol.id ORDER BY UPPER(pol.name)', args, function (err, result) {
            if (err) return next(err)

            result.rows.forEach(function (row) {
              team.policies.push(row)
            })
            next()
          })
        })

        async.series(tasks, (err) => {
          if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))

          done()
          return cb(null, team)
        })
      })
    },

    /*
     * $1 = id
     * $2 = name
     * $3 = description
     * $4 = users
     * $5 = policies
     */
    // TODO: Allow updating specific fields only
    updateTeam: function updateTeam (args, cb) {
      const [ id, name, description, users, policies ] = args
      const tasks = []

      dbPool.connect(function (err, client, done) {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        tasks.push((next) => { client.query('BEGIN', next) })
        tasks.push((next) => {
          client.query('UPDATE teams SET name = $2, description = $3 WHERE id = $1', [id, name, description], (err, res) => {
            if (err) return next(err)
            if (res.rowCount === 0) return next(Boom.notFound())

            next()
          })
        })
        tasks.push((next) => { client.query('DELETE FROM team_members WHERE team_id = $1', [id], next) })

        if (users.length > 0) {
          const stmt = dbUtil.buildInsertStmt('INSERT INTO team_members (user_id, team_id) VALUES ', users.map(u => [u.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('DELETE FROM team_policies WHERE team_id = $1', [id], next) })

        if (policies.length > 0) {
          const stmt = dbUtil.buildInsertStmt('INSERT INTO team_policies (policy_id, team_id) VALUES ', policies.map(p => [p.id, id]))
          tasks.push((next) => { client.query(stmt.statement, stmt.params, next) })
        }

        tasks.push((next) => { client.query('COMMIT', next) })

        async.series(tasks, (err) => {
          if (err) {
            dbUtil.rollback(client, done)
            return cb(err.isBoom ? err : Boom.badImplementation(err))
          }

          done()
          return cb(null, {id, name, description, users, policies})
        })
      })
    },

    /*
     * $1 = id
     */
    deleteTeamById: function deleteTeamById (params, cb) {
      dbUtil.withTransaction(dbPool, [
        (job, next) => {
          job.teamId = params.teamId
          job.organizationId = params.organizationId
          next()
        },
        deleteTeamMembers,
        deleteTeamPolicies,
        readDefaultPoliciesIds,
        deleteDefaultPolicies,
        deleteTeam
      ], (err) => {
        if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))
        cb()
      })
    }
  }

  return teamOps
}
