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

  function loadTeamDescendants (job, next) {
    const sql = SQL`
      SELECT id FROM teams WHERE
      org_id = ${job.organizationId}
      AND path @ ${job.teamId.toString()}`
    job.client.query(sql, (err, res) => {
      if (err) return next(err)
      if (res.rowCount === 0) return next(Boom.notFound())

      job.teamIds = res.rows.map(getId)
      next()
    })
  }

  function insertTeam (job, next) {

    const sql = SQL`
      INSERT INTO teams (id, name, description, team_parent_id, org_id, path) VALUES (
        DEFAULT,
        ${job.params.name},
        ${job.params.description},
        ${job.params.parentId},
        ${job.params.organizationId},
      `

    if (job.params.parentId) {
      sql.append(SQL`
        (SELECT path FROM teams WHERE id = ${job.params.parentId}) || currval('teams_id_seq')::varchar
      `)
    } else {
      sql.append(SQL`text2ltree(currval('teams_id_seq')::varchar)`)
    }

    sql.append(SQL`)RETURNING id`)

    job.client.query(sql, (err, res) => {
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

    const userId = job.user.id
    const sql = SQL`INSERT INTO user_policies (user_id, policy_id) VALUES`
    sql.append(SQL`(${userId},${job.policyIds[0]})`)
    job.policyIds.slice(1).forEach((policyId) => {
      sql.append(SQL`, (${userId},${policyId})`)
    })

    job.client.query(sql, next)
  }

  function removeTeams (job, next) {
    job.client.query(SQL`DELETE FROM teams WHERE id = ANY (${job.teamIds})`, (err, result) => {
      if (err) return next(err)
      if (result.rowCount === 0) return next(Boom.notFound())
      next()
    })
  }

  function deleteTeamsPolicies (job, next) {
    job.client.query(SQL`DELETE FROM team_policies WHERE team_id = ANY(${job.teamIds})`, next)
  }

  function deleteTeamsMembers (job, next) {
    job.client.query(SQL`DELETE FROM team_members WHERE team_id = ANY(${job.teamIds})`, next)
  }

  function deleteTeamPolicies (job, next) {
    job.client.query(SQL`DELETE FROM team_policies WHERE team_id = ${job.teamId}`, next)
  }

  function deleteTeamMembers (job, next) {
    job.client.query(SQL`DELETE FROM team_members WHERE team_id = ${job.teamId}`, next)
  }

  function insertTeamMembers (job, next) {
    const users = job.params.users
    const teamId = job.teamId

    if (users.length === 0) return next()

    const sql = SQL`INSERT INTO team_members (user_id, team_id) VALUES `
    sql.append(SQL`(${users[0].id},${teamId})`)
    users.forEach((user) => {
      sql.append(SQL`, (${user.id},${teamId})`)
    })
    job.client.query(sql, next)
  }

  function insertTeamPolicies (job, next) {
    const policies = job.params.policies
    const teamId = job.teamId

    if (policies.length === 0) return next()

    const sql = SQL`INSERT INTO team_policies (policy_id, team_id) VALUES `
    sql.append(SQL`(${policies[0].id},${teamId})`)
    policies.forEach((policy) => {
      sql.append(SQL`, (${policy.id},${teamId})`)
    })
    job.client.query(sql, next)
  }


  function readDefaultPoliciesIds (job, next) {
    job.policies = []

    async.each(job.teamIds, (teamId, done) => {
      policyOps.readTeamDefaultPolicies(job.client, job.organizationId, teamId, function (err, res) {
        if (err) return done(err)
        job.policies.push(...res.rows.map(getId))
        done()
      })
    }, next)
  }

  function deleteDefaultPolicies (job, next) {
    policyOps.deleteAllPolicyByIds(job.client, job.policies, next)
  }

  function updateTeamSql (job, next) {
    const teamId = job.teamId
    const {name, description, organizationId} = job.params

    const sql = SQL`
    UPDATE teams
    SET name = ${name}, description = ${description}
    WHERE id = ${teamId}
    AND org_id = ${organizationId}
    `

    job.client.query(sql, (err, res) => {
      if (err) return next(err)
      if (res.rowCount === 0) return next(Boom.notFound())

      next()
    })
  }

  function moveTeamSql (job, next) {
    const { parentId, id: teamId } = job.params
    const sql = SQL`
      UPDATE teams SET
      team_parent_id = ${parentId},
    `
    if (parentId) {
      sql.append(SQL`path = ((SELECT path FROM teams WHERE id = ${parentId}) || ${teamId.toString()})`)
    } else {
      sql.append(SQL`path = text2ltree(${teamId.toString()})`)
    }

    sql.append(SQL`
      WHERE id = ${teamId}
    `)
    job.client.query(sql, next)
  }

  function moveTeamDescendants (job, next) {
    const { id: teamId } = job.params
    const sql = SQL`
      UPDATE teams SET
      path = (SELECT path FROM teams WHERE id = ${teamId}) || subpath(path, index(path, ${teamId.toString()})+1)
      WHERE path ~ ${'*.' + teamId.toString() + '.*'}
      AND id != ${teamId}
    `

    job.client.query(sql, next)
  }

  var teamOps = {

    /**
     * List the teams in an organization
     *
     * @param  {Object}   params { organizationId }
     * @param  {Function} cb
     */
    listOrgTeams: function listOrgTeams (params, cb) {
      const { organizationId } = params

      const sqlQuery = SQL`
        SELECT  *
        FROM teams
        WHERE org_id = ${organizationId}
        ORDER BY UPPER(name)
      `
      dbPool.query(sqlQuery, function (err, result) {
        if (err) return cb(Boom.badImplementation(err))

        return cb(null, result.rows)
      })
    },

    /**
     * Creates a new team
     *
     * @param  {Object}   params { name, description, parentId, organizationId, user }
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

        teamOps.readTeam({ id: res.team.id, organizationId: params.organizationId }, cb)
      })
    },

    /**
     * Fetch specific team data
     *
     * @param  {params}   params { id, organizationId }
     * @param  {Function} cb
     */
    readTeam: function readTeam ({ id, organizationId }, cb) {
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
          const sql = SQL`
            SELECT id, name, description, path from teams WHERE id = ${id} AND org_id = ${organizationId}
          `

          client.query(sql, (err, result) => {
            if (err) return next(err)
            if (result.rowCount === 0) return next(Boom.notFound())

            const res = result.rows[0]

            team.id = res.id
            team.name = res.name
            team.description = res.description
            team.path = res.path
            next()
          })
        })

        tasks.push((next) => {
          const sql = SQL`
            SELECT users.id, users.name from team_members mem, users
            WHERE mem.team_id = ${id} and mem.user_id = users.id ORDER BY UPPER(users.name)
          `
          client.query(sql, function (err, result) {
            if (err) return next(err)

            result.rows.forEach(function (row) {
              team.users.push(row)
            })
            next()
          })
        })

        tasks.push((next) => {
          const sql = SQL`
            SELECT pol.id, pol.name, pol.version from team_policies tpol, policies pol
            WHERE tpol.team_id = ${id} and tpol.policy_id = pol.id ORDER BY UPPER(pol.name)
          `
          client.query(sql, function (err, result) {
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

     /**
     * @param {Object}    params {id, name, description, user, policies, organizationId }
     * @param {Function}  cb
     */
    updateTeam: function updateTeam (params, cb) {
      const { id, name, description, users, policies } = params
      const tasks = [
        (job, next) => {
          job.params = params
          job.teamId = id
          next()
        },
        updateTeamSql,
        deleteTeamMembers,
        deleteTeamPolicies,
        insertTeamMembers,
        insertTeamPolicies
      ]

      dbUtil.withTransaction(dbPool, tasks, (err) => {
        if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))
        cb(null, {id, name, description, users, policies})
      })
    },

    /**
     * Delete specific team
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb     [description]
     */
    deleteTeam: function deleteTeam (params, cb) {
      dbUtil.withTransaction(dbPool, [
        (job, next) => {
          job.teamId = params.id
          job.organizationId = params.organizationId
          next()
        },
        loadTeamDescendants,
        deleteTeamsMembers,
        deleteTeamsPolicies,
        readDefaultPoliciesIds,
        deleteDefaultPolicies,
        removeTeams
      ], (err) => {
        if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))
        cb()
      })
    },

    moveTeam: function moveTeam (params, cb) {
      const { id, organizationId } = params

      dbUtil.withTransaction(dbPool, [
        (job, next) => {
          job.params = params
          next()
        },
        moveTeamSql,
        moveTeamDescendants
      ], (err) => {
        if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))

        teamOps.readTeam({id, organizationId}, cb)
      })
    }
  }

  return teamOps
}
