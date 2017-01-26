'use strict'

const Boom = require('boom')
const uuid = require('uuid/v4')
const db = require('./../db')
const async = require('async')
const policyOps = require('./policyOps')
const userOps = require('./userOps')
const utils = require('./utils')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')
const conf = require('./../config')

function generateId () {
  return uuid().replace(/-/g, '_')
}

function getId (obj) {
  return obj.id
}

function loadTeamDescendants (job, next) {
  const sql = SQL`
    SELECT id FROM teams WHERE
    org_id = ${job.organizationId}
    AND path @ ${job.teamId.toString()}`
  job.client.query(sql, (err, res) => {
    if (err) return next(Boom.badImplementation(err))
    if (res.rowCount === 0) return next(Boom.notFound(`No team with ${job.teamId} has been found`))

    job.teamIds = res.rows.map(getId)
    next()
  })
}

function insertTeam (job, next) {
  const teamId = job.params.id || generateId()

  const sql = SQL`
    INSERT INTO teams (id, name, description, team_parent_id, org_id, path) VALUES (
      ${teamId.toString()},
      ${job.params.name},
      ${job.params.description},
      ${job.params.parentId},
      ${job.params.organizationId},
    `

  if (job.params.parentId) {
    sql.append(SQL`
      (SELECT path FROM teams WHERE id = ${job.params.parentId}) || ${teamId.toString()}
    `)
  } else {
    sql.append(SQL`${teamId.toString()}`)
  }

  sql.append(SQL`)RETURNING id`)

  job.client.query(sql, (err, res) => {
    if (utils.isUniqueViolationError(err)) {
      return next(Boom.badRequest(`Team with id ${teamId} already present`))
    }
    if (err) return next(Boom.badImplementation(err))

    job.team = res.rows[0]
    next()
  })
}

function createDefaultPolicies (job, next) {
  policyOps.createTeamDefaultPolicies(job.client, job.params.organizationId, job.team.id, (err, res) => {
    if (err) return next(Boom.badImplementation(err))
    job.policyIds = res.rows.map(getId)
    next()
  })
}

function createDefaultUser (job, next) {
  if (!job.params.user) return next()
  const { id, name } = job.params.user
  const { organizationId } = job.params

  userOps.insertUser(job.client, { id, name, organizationId }, (err, user) => {
    if (err) return next(Boom.badImplementation(err))

    job.user = user.rows[0]
    next()
  })
}

function assignDefaultUserToTeam (job, next) {
  if (!job.user) return next()

  job.client.query(SQL`INSERT INTO team_members (team_id, user_id) VALUES (${job.team.id}, ${job.user.id})`, utils.boomErrorWrapper(next))
}

function makeDefaultUserAdmin (job, next) {
  if (!job.user) return next()

  const userId = job.user.id
  const sql = SQL`INSERT INTO user_policies (user_id, policy_id) VALUES`
  sql.append(SQL`(${userId},${job.policyIds[0]})`)
  job.policyIds.slice(1).forEach((policyId) => {
    sql.append(SQL`, (${userId},${policyId})`)
  })

  job.client.query(sql, utils.boomErrorWrapper(next))
}

function removeTeams (job, next) {
  const { teamId, teamIds, organizationId } = job

  job.client.query(SQL`DELETE FROM teams WHERE id = ANY (${teamIds}) AND org_id = ${organizationId} RETURNING id`, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rows.map(getId).indexOf(teamId) < 0) return next(Boom.notFound(`Could not find team [${teamId}] to be deleted`))
    next()
  })
}

function deleteTeamsPolicies (job, next) {
  job.client.query(SQL`DELETE FROM team_policies WHERE team_id = ANY(${job.teamIds})`, utils.boomErrorWrapper(next))
}

function deleteTeamsMembers (job, next) {
  job.client.query(SQL`DELETE FROM team_members WHERE team_id = ANY(${job.teamIds})`, utils.boomErrorWrapper(next))
}

function clearTeamPolicies (job, next) {
  job.client.query(SQL`DELETE FROM team_policies WHERE team_id = ${job.teamId}`, utils.boomErrorWrapper(next))
}

function deleteTeamUsers (job, next) {
  job.client.query(SQL`DELETE FROM team_members WHERE team_id = ${job.teamId}`, utils.boomErrorWrapper(next))
}

function deleteTeamUser (job, next) {
  job.client.query(SQL`DELETE FROM team_members WHERE team_id = ${job.teamId} AND user_id = ${job.userId}`, utils.boomErrorWrapper(next))
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
  job.client.query(sql, utils.boomErrorWrapper(next))
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
  job.client.query(sql, utils.boomErrorWrapper(next))
}


function readDefaultPoliciesIds (job, next) {
  job.policies = []

  async.each(job.teamIds, (teamId, done) => {
    policyOps.readTeamDefaultPolicies(job.client, job.organizationId, teamId, function (err, res) {
      if (err) return done(Boom.badImplementation(err))
      job.policies.push(...res.rows.map(getId))
      done()
    })
  }, next)
}

function deleteDefaultPolicies (job, next) {
  policyOps.deleteAllPolicyByIds(job.client, job.policies, job.organizationId, utils.boomErrorWrapper(next))
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
  job.client.query(sql, utils.boomErrorWrapper(next))
}

function moveTeamDescendants (job, next) {
  const { id: teamId } = job.params
  const sql = SQL`
    UPDATE teams SET
    path = (SELECT path FROM teams WHERE id = ${teamId}) || subpath(path, index(path, ${teamId.toString()})+1)
    WHERE path ~ ${'*.' + teamId.toString() + '.*'}
    AND id != ${teamId}
  `

  job.client.query(sql, utils.boomErrorWrapper(next))
}

function removeTeamPolicy (job, next) {
  const { teamId, policyId } = job

  const sqlQuery = SQL`
    DELETE FROM team_policies
    WHERE team_id = ${teamId}
    AND policy_id = ${policyId}
  `
  job.client.query(sqlQuery, utils.boomErrorWrapper(next))
}

function checkBothTeamsFromSameOrg (job, cb) {
  const { id, parentId, organizationId } = job.params
  const ids = [id]

  if (parentId) ids.push(parentId)

  utils.checkTeamsOrg(job.client, ids, organizationId, cb)
}

function checkTeamExists (job, next) {
  const { teamId, organizationId } = job

  const sqlQuery = SQL`
    SELECT id
    FROM teams
    WHERE id = ${teamId}
    AND org_id = ${organizationId}
  `
  job.client.query(sqlQuery, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rowCount === 0) return next(Boom.notFound(`Team with id ${teamId} could not be found`))

    next()
  })
}

function loadTeams (job, next) {
  const { id, organizationId } = job
  const sql = SQL`
    SELECT *
    FROM teams
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `
  db.query(sql, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rowCount === 0) return next(Boom.notFound(`Team with id ${id} could not be found`))

    job.team = mapping.team(result.rows[0])

    job.team.users = []
    job.team.policies = []
    next()
  })
}

function loadTeamUsers (job, next) {
  const { id, offset, limit } = job
  const sql = SQL`
    SELECT users.id, users.name, COUNT(*) OVER() AS total_users_count
    FROM team_members mem, users
    WHERE mem.team_id = ${id}
    AND mem.user_id = users.id
    ORDER BY UPPER(users.name)
  `
  if (limit) {
    sql.append(SQL` LIMIT ${limit}`)
  }
  if (offset) {
    sql.append(SQL` OFFSET ${offset}`)
  }
  db.query(sql, function (err, result) {
    if (err) return next(Boom.badImplementation(err))

    job.totalUsersCount = result.rowCount > 0 ? parseInt(result.rows[0].total_users_count) : 0
    job.team.usersCount = result.rowCount
    job.team.users = result.rows.map(mapping.user.simple)
    next()
  })
}

function loadTeamPolicies (job, next) {
  const { id } = job
  const sql = SQL`
    SELECT pol.id, pol.name, pol.version
    FROM team_policies tpol, policies pol
    WHERE tpol.team_id = ${id}
    AND tpol.policy_id = pol.id
    ORDER BY UPPER(pol.name)
  `
  db.query(sql, function (err, result) {
    if (err) return next(Boom.badImplementation(err))

    job.team.policies = result.rows.map(mapping.policy.simple)
    next()
  })
}

var teamOps = {

  /**
   * List the teams in an organization
   *
   * @param  {Object}   params { organizationId, limit, page } where page is 1-indexed
   * @param  {Function} cb
   */
  listOrgTeams: function listOrgTeams (params, cb) {
    let { organizationId, limit, page } = params

    let sqlQuery = SQL`
      WITH total AS (
        SELECT COUNT(*) AS cnt
        FROM teams
        WHERE org_id = ${organizationId}
      )
      SELECT
        teams.id,
        teams.name,
        teams.description,
        teams.path,
        teams.org_id,
        t.cnt::INTEGER AS total,
        COUNT(team_members.team_id) AS users_count
      FROM teams
      LEFT JOIN team_members ON team_members.team_id = teams.id
      INNER JOIN total AS t ON 1=1
      WHERE org_id = ${organizationId}
      GROUP BY teams.id, teams.name, teams.description, teams.path, teams.org_id, t.cnt
      ORDER BY UPPER(name)
    `

    if (limit) {
      sqlQuery.append(SQL` LIMIT ${limit}`)
    }
    if (limit && page) {
      let offset = (page - 1) * limit
      sqlQuery.append(SQL` OFFSET ${offset}`)
    }

    db.query(sqlQuery, function (err, result) {
      if (err) return cb(err)
      let total = result.rows.length > 0 ? result.rows[0].total : 0
      return cb(null, result.rows.map(mapping.team.list), total)
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
      if (err) return cb(err)

      teamOps.readTeam({ id: res.team.id, organizationId: params.organizationId }, cb)
    })
  },

  /**
   * Fetch the users data from a team
   *
   * @param  {params}   params { id, page, limit }
   * @param  {Function} cb
   */
  readTeamUsers: function readTeamUsers ({ id, page = 1, limit }, cb) {
    const pageLimit = limit || conf.get('authorization.defaultPageSize')
    const offset = (page - 1) * pageLimit

    const job = {
      id: id,
      offset: offset,
      limit: pageLimit,
      team: {}
    }

    loadTeamUsers(job, (err) => {
      if (err) return cb(err)
      const pageSize = pageLimit || job.totalUsersCount
      const result = {
        page: page,
        limit: pageSize,
        total: job.totalUsersCount,
        data: job.team.users
      }
      return cb(null, result)
    })
  },

  /**
   * Fetch specific team data
   *
   * @param  {params}   params { id, organizationId }
   * @param  {Function} cb
   */
  readTeam: function readTeam ({ id, organizationId }, cb) {
    const job = {
      team: {}
    }

    async.applyEachSeries([
      (job, next) => {
        job.id = id
        job.organizationId = organizationId
        next()
      },
      loadTeams,
      loadTeamUsers,
      loadTeamPolicies
    ], job, (err) => {
      if (err) return cb(err)

      return cb(null, job.team)
    })
  },

   /**
   * @param {Object}    params {id, name, description, organizationId }
   * @param {Function}  cb
   */
  updateTeam: function updateTeam (params, cb) {
    const { id, name, description, organizationId } = params
    const updates = []

    const sql = SQL` UPDATE teams SET `
    if (name) { updates.push(SQL`name = ${name}`) }
    if (description) { updates.push(SQL`description = ${description}`) }
    sql.append(sql.glue(updates, ' , '))
    sql.append(SQL`
      WHERE id = ${id}
      AND org_id = ${organizationId}
    `)


    db.query(sql, (err, res) => {
      if (err) return cb(Boom.badImplementation(err))
      if (res.rowCount === 0) return cb(Boom.notFound(`Team with id ${id} could not be found`))

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
      if (err) return cb(err)
      cb()
    })
  },

  /**
   * Nest/Un-nest a team
   *
   * @param  {Object}   params { id, parentId = null, organizationId }
   * @param  {Function} cb
   */
  moveTeam: function moveTeam (params, cb) {
    const { id, organizationId } = params

    db.withTransaction([
      (job, next) => {
        job.params = params
        next()
      },
      checkBothTeamsFromSameOrg,
      moveTeamSql,
      moveTeamDescendants
    ], (err) => {
      if (err) return cb(err)

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
      (job, next) => {
        utils.checkPoliciesOrg(job.client, job.policies, job.organizationId, next)
      },
      clearTeamPolicies,
      insertTeamPolicies
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

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

    utils.checkPoliciesOrg(db, policies, organizationId, (err) => {
      if (err) return cb(err)

      insertTeamPolicies({ client: db, teamId: id, policies }, (err, res) => {
        if (err) return cb(err)

        teamOps.readTeam({ id, organizationId }, cb)
      })
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
      if (err) return cb(err)

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
      if (err) return cb(err)

      teamOps.readTeam({ id: teamId, organizationId }, cb)
    })
  },

  /**
   * Add one or more users to a team
   *
   * @param  {Object}   params { id, users, organizationId }
   * @param  {Function} cb
   */
  addUsersToTeam: function addUsersToTeam (params, cb) {
    const { id, organizationId } = params
    const tasks = [
      (job, next) => {
        job.teamId = id
        job.organizationId = organizationId
        job.params = params

        next()
      },
      (job, next) => {
        utils.checkUsersOrg(job.client, job.params.users, job.organizationId, next)
      },
      checkTeamExists,
      insertTeamMembers
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Replace team members
   *
   * @param  {Object}   params { id, users, organizationId }
   * @param  {Function} cb
   */
  replaceUsersInTeam: function replaceUsersInTeam (params, cb) {
    const { id, organizationId } = params
    const tasks = [
      (job, next) => {
        job.teamId = params.id
        job.organizationId = params.organizationId
        job.params = params

        next()
      },
      (job, next) => {
        utils.checkUsersOrg(job.client, job.params.users, job.organizationId, next)
      },
      checkTeamExists,
      deleteTeamUsers,
      insertTeamMembers
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      teamOps.readTeam({ id, organizationId }, cb)
    })
  },

  /**
   * Delete team members
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb
   */
  deleteTeamMembers: function deleteTeamMembers (params, cb) {
    const { id, organizationId } = params

    const tasks = [
      (job, next) => {
        job.teamId = id
        job.organizationId = organizationId

        next()
      },
      checkTeamExists,
      deleteTeamUsers
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      cb()
    })
  },

  /**
   * Delete one team member
   *
   * @param  {Object}   params { id, userId, organizationId }
   * @param  {Function} cb
   */
  deleteTeamMember: function deleteTeamMember (params, cb) {
    const { id, userId, organizationId } = params
    const tasks = [
      (job, next) => {
        job.teamId = id
        job.organizationId = organizationId
        job.userId = userId

        next()
      },
      checkTeamExists,
      deleteTeamUser
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      cb()
    })
  }
}

module.exports = teamOps
