'use strict'

const Boom = require('boom')
const db = require('./../db')
const async = require('async')
const policyOps = require('./policyOps')
const userOps = require('./userOps')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')

function getId (obj) {
  return obj.id
}

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

  userOps.insertUser(job.client, job.params.user.name, job.params.user.token, job.params.organizationId, (err, user) => {
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

function clearTeamPolicies (job, next) {
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
  sql.append(SQL`(${users[0]},${teamId})`)
  users.slice(1).forEach((userId) => {
    sql.append(SQL`, (${userId},${teamId})`)
  })
  sql.append(SQL` ON CONFLICT ON CONSTRAINT team_member_link DO NOTHING`)
  job.client.query(sql, next)
}

function insertTeamPolicies (job, next) {
  const policies = job.policies
  const teamId = job.teamId

  if (policies.length === 0) return next()

  const sql = SQL`INSERT INTO team_policies (policy_id, team_id) VALUES `
  sql.append(SQL`(${policies[0]},${teamId})`)
  policies.slice(1).forEach((policyId) => {
    sql.append(SQL`, (${policyId},${teamId})`)
  })
  sql.append(SQL` ON CONFLICT ON CONSTRAINT team_policy_link DO NOTHING`)
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
  const updates = []

  if (!name && !description) {
    return next()
  }

  const sql = SQL` UPDATE teams SET `

  if (name) { updates.push(SQL`name = ${name}`) }
  if (description) { updates.push(SQL`description = ${description}`) }

  sql.append(sql.glue(updates, ' , '))

  sql.append(SQL`
    WHERE id = ${teamId}
    AND org_id = ${organizationId}
  `)

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

function removeTeamPolicy (job, next) {
  const { teamId, policyId } = job

  const sqlQuery = SQL`
    DELETE FROM team_policies
    WHERE team_id = ${teamId}
    AND policy_id = ${policyId}
  `
  job.client.query(sqlQuery, next)
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
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))

      return cb(null, result.rows.map(mapping.team))
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

    db.withTransaction(tasks, (err, res) => {
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
    const tasks = []
    let team

    tasks.push((next) => {
      const sql = SQL`
        SELECT id, name, description, path
        FROM teams
        WHERE id = ${id}
        AND org_id = ${organizationId}
      `

      db.query(sql, (err, result) => {
        if (err) return next(err)
        if (result.rowCount === 0) return next(Boom.notFound())

        team = mapping.team(result.rows[0])
        team.users = []
        team.policies = []
        next()
      })
    })

    tasks.push((next) => {
      const sql = SQL`
        SELECT users.token, users.name
        FROM team_members mem, users
        WHERE mem.team_id = ${id}
        AND mem.user_id = users.id
        ORDER BY UPPER(users.name)
      `
      db.query(sql, function (err, result) {
        if (err) return next(err)

        team.users = result.rows.map(mapping.user.simple)
        next()
      })
    })

    tasks.push((next) => {
      const sql = SQL`
        SELECT pol.id, pol.name, pol.version
        FROM team_policies tpol, policies pol
        WHERE tpol.team_id = ${id}
        AND tpol.policy_id = pol.id
        ORDER BY UPPER(pol.name)
      `
      db.query(sql, function (err, result) {
        if (err) return next(err)

        team.policies = result.rows.map(mapping.policy.simple)
        next()
      })
    })

    async.series(tasks, (err) => {
      if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))

      return cb(null, team)
    })
  },

   /**
   * @param {Object}    params {id, name, description, user, policies, organizationId }
   * @param {Function}  cb
   */
  updateTeam: function updateTeam (params, cb) {
    const { id, organizationId, users } = params
    const tasks = [
      (job, next) => {
        job.params = params
        job.teamId = id
        next()
      },
      updateTeamSql
    ]

    if (users) {
      tasks.push(deleteTeamMembers)
      tasks.push(insertTeamMembers)
    }

    db.withTransaction(tasks, (err) => {
      if (err) return cb(err.isBoom ? err : Boom.badImplementation(err))

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Delete specific team
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb     [description]
   */
  deleteTeam: function deleteTeam (params, cb) {
    db.withTransaction([
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

    db.withTransaction([
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
  },

  /**
   * Replace team poilicies
   *
   * @param  {Object}   params { id, organizationId, policies }
   * @param  {Function} cb
   */
  replaceTeamPolicies: function replaceTeamPolicies (params, cb) {
    const { id, organizationId, policies } = params
    const tasks = [
      (job, next) => {
        job.teamId = id
        job.organizationId = organizationId
        job.policies = policies

        next()
      },
      clearTeamPolicies,
      insertTeamPolicies
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Add one or more policies to a team
   *
   * @param  {Object}   params { id, organizationId, policies }
   * @param  {Function} cb
   */
  addTeamPolicies: function addTeamPolicies (params, cb) {
    const { id, organizationId, policies } = params

    insertTeamPolicies({ client: db, teamId: id, policies }, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Remove all team's policies
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb
   */
  deleteTeamPolicies: function deleteTeamPolicies (params, cb) {
    const { id, organizationId } = params

    clearTeamPolicies({ teamId: id, client: db }, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Remove a specific team policy
   *
   * @param  {Object}   params { userId, organizationId, policyId }
   * @param  {Function} cb
   */
  deleteTeamPolicy: function deleteTeamPolicy (params, cb) {
    const { teamId, organizationId, policyId } = params

    removeTeamPolicy({ client: db, teamId, policyId }, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      teamOps.readTeam({ id: teamId, organizationId }, cb)
    })
  }
}

module.exports = teamOps
