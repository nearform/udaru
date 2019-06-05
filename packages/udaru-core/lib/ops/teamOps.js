'use strict'

const _ = require('lodash')
const Joi = require('joi')
const Boom = require('boom')
const uuid = require('uuid/v4')
const async = require('async')
const SQL = require('@nearform/sql')
const asyncify = require('../asyncify')
const mapping = require('../mapping')
const utils = require('./utils')
const validationRules = require('./validation').teams

const buildPolicyOps = require('./policyOps')
const buildUserOps = require('./userOps')

function idToPath (id) {
  return id.replace(/-/g, '_')
}

function getId (obj) {
  return obj.id
}

function buildTeamOps (db, config) {
  const policyOps = buildPolicyOps(db, config)
  const userOps = buildUserOps(db, config)

  function loadTeamDescendants (job, next) {
    const teamPath = idToPath(job.teamId)
    const sql = SQL`
      SELECT id FROM teams WHERE
      org_id = ${job.organizationId}
      AND path @ ${teamPath.toString()}`
    job.client.query(sql, (err, res) => {
      if (err) return next(Boom.badImplementation(err))
      if (res.rowCount === 0) return next(Boom.notFound(`No team with ${job.teamId} has been found`))

      job.teamIds = res.rows.map(getId)
      next()
    })
  }

  function insertTeam (job, next) {
    const teamId = job.params.id || uuid()
    const teamPath = idToPath(teamId)

    const sql = SQL`
      INSERT INTO teams (id, name, description, metadata, team_parent_id, org_id, path) VALUES (
        ${teamId.toString()},
        ${job.params.name},
        ${job.params.description},
        ${job.params.metadata || null},
        ${job.params.parentId || null},
        ${job.params.organizationId},
      `
    if (job.params.parentId) {
      sql.append(SQL`
        (SELECT path FROM teams WHERE id = ${job.params.parentId}) || ${teamPath.toString()}
      `)
    } else {
      sql.append(SQL`${teamPath.toString()}`)
    }

    sql.append(SQL`)RETURNING id`)

    job.client.query(sql, (err, res) => {
      if (utils.isUniqueViolationError(err)) return next(Boom.conflict(err.detail))
      if (err) return next(Boom.badImplementation(err))

      job.team = res.rows[0]
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

    const newPolicies = _.filter(policies, function (p) { if (!p.instance) return true })

    if (newPolicies.length === 0) return next()

    const sql = SQL`INSERT INTO team_policies (policy_id, team_id, variables) VALUES `
    sql.append(SQL`(${newPolicies[0].id},${teamId},${newPolicies[0].variables})`)
    newPolicies.slice(1).forEach((policy) => {
      sql.append(SQL`, (${policy.id},${teamId}, ${policy.variables})`)
    })
    sql.append(SQL` ON CONFLICT ON CONSTRAINT team_policy_link DO NOTHING`)
    job.client.query(sql, (err, result) => {
      if (utils.isUniqueViolationError(err)) return next(Boom.conflict(err.detail))
      if (err) return next(Boom.badImplementation(err))
      return next(null, result)
    })
  }

  function updateTeamPolicies (job, next) {
    const policies = job.policies
    const teamId = job.teamId

    const policiesToUpdate = _.filter(policies, function (p) { if (p.instance) return true })

    if (policiesToUpdate.length === 0) return next()

    const sqlQuery = SQL`
      UPDATE team_policies AS tpol SET variables = inst.variables FROM ( VALUES
    `
    sqlQuery.append(SQL`(${policiesToUpdate[0].id}, ${policiesToUpdate[0].instance}, ${teamId}, ${policiesToUpdate[0].variables}::JSONB) \n`)
    policiesToUpdate.slice(1).forEach((policy) => {
      sqlQuery.append(SQL`, (${policy.id}, ${policy.instance}, ${teamId}, ${policy.variables}::JSONB) \n`)
    })

    sqlQuery.append(SQL`) AS inst(policy_id, policy_instance, team_id, variables)  
      WHERE (tpol.policy_id = inst.policy_id 
      AND tpol.policy_instance::integer = inst.policy_instance::integer
      AND tpol.team_id = inst.team_id);`) // constraint prevents insertion of policy with same variable set

    job.client.query(sqlQuery, (err, result) => {
      if (utils.isUniqueViolationError(err)) return next(Boom.conflict(err.detail))
      if (err) return next(Boom.badImplementation(err))
      return next(null, result)
    })
  }

  function moveTeamSql (job, next) {
    const { parentId, id: teamId } = job.params
    const sql = SQL`
      UPDATE teams SET
      team_parent_id = ${parentId},
    `
    const teamPath = idToPath(teamId)
    if (parentId) {
      sql.append(SQL`path = ((SELECT path FROM teams WHERE id = ${parentId}) || ${teamPath.toString()})`)
    } else {
      sql.append(SQL`path = text2ltree(${teamPath.toString()})`)
    }

    sql.append(SQL`
      WHERE id = ${teamId}
    `)
    job.client.query(sql, utils.boomErrorWrapper(next))
  }

  function moveTeamDescendants (job, next) {
    const { id: teamId } = job.params
    const teamPath = idToPath(teamId)
    const sql = SQL`
      UPDATE teams SET
      path = (SELECT path FROM teams WHERE id = ${teamId}) || subpath(path, index(path, ${teamPath.toString()})+1)
      WHERE path ~ ${'*.' + teamPath.toString() + '.*'}
      AND id != ${teamId}
    `

    job.client.query(sql, utils.boomErrorWrapper(next))
  }

  function removeTeamPolicy (job, next) {
    const { teamId, policyId, instance } = job

    const sqlQuery = SQL`
      DELETE FROM team_policies
      WHERE team_id = ${teamId}
      AND policy_id = ${policyId}
    `

    if (instance) {
      sqlQuery.append(SQL`AND policy_instance = ${instance}`)
    }

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
    job.client.query(sql, (err, result) => {
      if (err) return next(Boom.badImplementation(err))
      if (result.rowCount === 0) return next(Boom.notFound(`Team with id ${id} could not be found`))

      job.team = mapping.team(result.rows[0])

      job.team.users = []
      job.team.policies = []
      next()
    })
  }

  function loadTeamUsers (job, next) {
    const { id, offset, limit, organizationId } = job
    const sql = SQL`
      SELECT users.id, users.name, COUNT(*) OVER() AS total_users_count
      FROM team_members mem, users
      WHERE mem.team_id = ${id}
      AND mem.user_id = users.id
      AND users.org_id = ${organizationId}
      ORDER BY UPPER(users.name)
    `
    if (limit) {
      sql.append(SQL` LIMIT ${limit}`)
    }
    if (offset) {
      sql.append(SQL` OFFSET ${offset}`)
    }

    job.client.query(sql, function (err, result) {
      if (err) return next(Boom.badImplementation(err))

      job.totalUsersCount = result.rowCount > 0 ? parseInt(result.rows[0].total_users_count, 10) : 0
      job.team.usersCount = result.rowCount
      job.team.users = result.rows.map(mapping.user.simple)
      next()
    })
  }

  function loadTeamPolicies (job, next) {
    const { id, offset, limit } = job

    const sql = SQL`
      SELECT pol.id, pol.name, pol.version, tpol.variables, tpol.policy_instance, COUNT(*) OVER() AS total_policies_count
      FROM team_policies tpol, policies pol
      WHERE tpol.team_id = ${id}
      AND tpol.policy_id = pol.id
      ORDER BY UPPER(pol.name)
    `
    if (limit) {
      sql.append(SQL` LIMIT ${limit}`)
    }
    if (offset) {
      sql.append(SQL` OFFSET ${offset}`)
    }

    job.client.query(sql, function (err, result) {
      if (err) return next(Boom.badImplementation(err))

      job.totalPoliciesCount = result.rowCount > 0 ? parseInt(result.rows[0].total_policies_count, 10) : 0
      job.team.policies = result.rows.map(mapping.policy.simple)
      next()
    })
  }

  function createDefaultUser (job, next) {
    if (!job.params.user) return next()
    const { id, name } = job.params.user
    const { organizationId } = job.params

    userOps.insertUser(job.client, { id, name, organizationId }, (err, user) => {
      if (err) return next(err)

      job.user = user.rows[0]
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
    policyOps.deleteAllPolicyByIds(job.client, job.policies, job.organizationId, utils.boomErrorWrapper(next))
  }

  const teamOps = {
    /**
     * List the teams in an organization
     *
     * @param  {Object}   params { organizationId, limit, page } where page is 1-indexed
     * @param  {Function} cb
     */
    listOrgTeams: function listOrgTeams (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      let { organizationId, limit, page } = params

      Joi.validate({ organizationId, page, limit }, validationRules.listOrgTeams, function (err) {
        if (err) return cb(Boom.badRequest(err))

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
          if (err) return cb(Boom.badImplementation(err))
          let total = result.rows.length > 0 ? result.rows[0].total : 0
          return cb(null, result.rows.map(mapping.team.list), total)
        })
      })

      return promise
    },

    /**
     * Creates a new team
     *
     * @param  {Object}   params { id, name, description, metadata, parentId, organizationId, user } "metadata" optoinal
     * @param  {Object}   opts { createOnly }
     * @param  {Function} cb
     */
    createTeam: function createTeam (params, opts, cb) {
      if (!cb) {
        cb = opts
      }
      if (!opts || typeof opts === 'function') {
        opts = {}
      }

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { createOnly } = opts
      const tasks = [
        (job, next) => {
          const { id, name, description, metadata, parentId, organizationId, user } = params

          // We should not use boom but return specific errors that will be then handled out side the udaru.js module
          Joi.validate({ id, name, description, metadata, parentId, organizationId, user }, validationRules.createTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      return promise
    },

    /**
     * Fetch a team's policies
     *
     * @param  {params}   params { id, page, limit }
     * @param  {Function} cb
     */
    listTeamPolicies: function listTeamPolicies ({ id, page = 1, limit, organizationId }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      Joi.validate({ id, page, limit, organizationId }, validationRules.listTeamPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const pageLimit = limit || _.get(config, 'authorization.defaultPageSize')
        const offset = (page - 1) * pageLimit

        const job = {
          id: id,
          organizationId: organizationId,
          offset: offset,
          limit: pageLimit,
          team: {},
          client: db
        }

        loadTeamPolicies(job, (err) => {
          if (err) return cb(err)
          const pageSize = pageLimit || job.totalPoliciesCount
          const result = {
            page: page,
            limit: pageSize,
            total: job.totalPoliciesCount,
            data: job.team.policies
          }
          return cb(null, result)
        })
      })

      return promise
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

      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      async.applyEachSeries([
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.readTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.client = db
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

      return promise
    },

    /**
     * Uodate team data
     * @param {Object}   params {id, name, description, metadata, organizationId } "metadata" optional
     * @param {Function} cb
     */
    updateTeam: function updateTeam (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, name, description, metadata, organizationId } = params

      Joi.validate({ id, name, description, organizationId, metadata }, Joi.object().keys(validationRules.updateTeam).or('name', 'description'), function (err) {
        if (err) return cb(Boom.badRequest(err))

        const updates = []
        const sql = SQL` UPDATE teams SET `
        if (name) { updates.push(SQL`name = ${name}`) }
        if (description) { updates.push(SQL`description = ${description}`) }
        if (metadata) { updates.push(SQL`metadata = ${metadata}`) }
        sql.append(sql.glue(updates, ' , '))
        sql.append(SQL`
          WHERE id = ${id}
          AND org_id = ${organizationId}
        `)

        db.query(sql, (err, res) => {
          if (utils.isUniqueViolationError(err)) return cb(Boom.conflict(err.detail))
          if (err) return cb(Boom.badImplementation(err))
          if (res.rowCount === 0) return cb(Boom.notFound(`Team with id ${id} could not be found`))

          teamOps.readTeam({ id, organizationId }, cb)
        })
      })

      return promise
    },

    /**
     * Delete specific team
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb     [description]
     */
    deleteTeam: function deleteTeam (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      db.withTransaction([
        (job, next) => {
          const { id, organizationId } = params

          Joi.validate({ id, organizationId }, validationRules.deleteTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      return promise
    },
    /**
     * List a nested team in an organization
     *
     * @param  {Object}   params { organizationId, id, limit, page } where page is 1-indexed
     * @param  {Function} cb
     */
    listNestedTeams: function listNestedTeams (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      let { organizationId, id, limit, page } = params

      Joi.validate({ organizationId, id, page, limit }, validationRules.listNestedTeams, function (err) {
        if (err) return cb(Boom.badRequest(err))

        let sqlQuery = SQL`
          WITH total AS (
            SELECT COUNT(*) AS cnt
            FROM teams
            WHERE org_id = ${organizationId} AND team_parent_id = ${id}
          )
          SELECT
            teams.id,
            teams.name,
            teams.description,
            teams.team_parent_id as parent_id,
            teams.path,
            teams.org_id,
            t.cnt::INTEGER AS total,
            COUNT(team_members.team_id) AS users_count
          FROM teams
          LEFT JOIN team_members ON team_members.team_id = teams.id
          INNER JOIN total AS t ON 1=1
          WHERE org_id = ${organizationId} AND team_parent_id = ${id}
          GROUP BY teams.id, teams.name, teams.description, teams.team_parent_id, teams.path, teams.org_id, t.cnt
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
          if (err) return cb(Boom.badImplementation(err))

          let total = result.rows.length > 0 ? result.rows[0].total : 0
          return cb(null, result.rows.map(mapping.team.listNestedTeam), total)
        })
      })

      return promise
    },

    /**
     * Nest/Un-nest a team
     *
     * @param  {Object}   params { id, parentId = null, organizationId }
     * @param  {Function} cb
     */
    moveTeam: function moveTeam (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params

      db.withTransaction([
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.moveTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.params = params
          next()
        },
        checkBothTeamsFromSameOrg,
        moveTeamSql,
        moveTeamDescendants
      ], (err) => {
        if (err) return cb(err)
        teamOps.readTeam({ id, organizationId }, cb)
      })

      return promise
    },

    /**
     * Add one or more policies to a team
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    addTeamPolicies: function addTeamPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params

      Joi.validate({ id, organizationId, policies: params.policies }, validationRules.addTeamPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const policies = utils.preparePolicies(params.policies)

        utils.checkPoliciesOrg(db, policies, organizationId, (err) => {
          if (err) return cb(err)

          insertTeamPolicies({ client: db, teamId: id, policies }, (err, res) => {
            if (err) return cb(err)
            teamOps.readTeam({ id, organizationId }, cb)
          })
        })
      })

      return promise
    },

    /**
     * Amends one or more policies belonging to a team, (will only update items with instance specified)
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    amendTeamPolicies: function amendTeamPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params

      Joi.validate({ id, organizationId, policies: params.policies }, validationRules.amendTeamPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const policies = utils.preparePolicies(params.policies)

        utils.checkPoliciesOrg(db, policies, organizationId, (err) => {
          if (err) return cb(err)

          insertTeamPolicies({ client: db, teamId: id, policies }, (err, res) => {
            if (err) return cb(err)
            updateTeamPolicies({ client: db, teamId: id, policies }, (err, res) => {
              if (err) return cb(err)
              teamOps.readTeam({ id, organizationId }, cb)
            })
          })
        })
      })

      return promise
    },

    /**
     * Replace team poilicies
     *
     * @param  {Object}   params { id, organizationId, policies }
     * @param  {Function} cb
     */
    replaceTeamPolicies: function replaceTeamPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId, policies } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId, policies }, validationRules.replaceTeamPolicies, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
        (job, next) => {
          job.teamId = id
          job.organizationId = organizationId
          job.policies = utils.preparePolicies(policies)
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

      return promise
    },

    /**
     * Remove all team's policies
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteTeamPolicies: function deleteTeamPolicies (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params

      Joi.validate({ id, organizationId }, validationRules.deleteTeamPolicies, function (err) {
        if (err) return cb(Boom.badRequest(err))

        clearTeamPolicies({ teamId: id, client: db }, (err, res) => {
          if (err) return cb(err)
          teamOps.readTeam({ id, organizationId }, cb)
        })
      })

      return promise
    },

    /**
     * Remove a specific team policy
     *
     * @param  {Object}   params { userId, organizationId, policyId, instance } "instance" optional
     * @param  {Function} cb
     */
    deleteTeamPolicy: function deleteTeamPolicy (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { teamId, organizationId, policyId, instance } = params

      Joi.validate({ teamId, organizationId, policyId, instance }, validationRules.deleteTeamPolicy, function (err) {
        if (err) return cb(Boom.badRequest(err))

        removeTeamPolicy({ client: db, teamId, policyId, instance }, (err, res) => {
          if (err) return cb(err)
          teamOps.readTeam({ id: teamId, organizationId }, cb)
        })
      })

      return promise
    },

    /**
     * Fetch the users data from a team
     *
     * @param  {params}   params { id, page, limit }
     * @param  {Function} cb
     */
    readTeamUsers: function readTeamUsers ({ id, page = 1, limit, organizationId }, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      Joi.validate({ id, page, limit, organizationId }, validationRules.readTeamUsers, function (err) {
        if (err) return cb(Boom.badRequest(err))

        const pageLimit = limit || _.get(config, 'authorization.defaultPageSize')
        const offset = (page - 1) * pageLimit

        const job = {
          id: id,
          organizationId: organizationId,
          offset: offset,
          limit: pageLimit,
          team: {},
          client: db
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
      })

      return promise
    },

    /**
     * Add one or more users to a team
     *
     * @param  {Object}   params { id, users, organizationId }
     * @param  {Function} cb
     */
    addUsersToTeam: function addUsersToTeam (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, users, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, users, organizationId }, validationRules.addUsersToTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      return promise
    },

    /**
     * Replace team members
     *
     * @param  {Object}   params { id, users, organizationId }
     * @param  {Function} cb
     */
    replaceUsersInTeam: function replaceUsersInTeam (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, users, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, users, organizationId }, validationRules.replaceUsersInTeam, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      return promise
    },

    /**
     * Delete team members
     *
     * @param  {Object}   params { id, organizationId }
     * @param  {Function} cb
     */
    deleteTeamMembers: function deleteTeamMembers (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, organizationId } = params

      const tasks = [
        (job, next) => {
          Joi.validate({ id, organizationId }, validationRules.deleteTeamMembers, (err) => {
            if (err) return next(Boom.badRequest(err))

            next()
          })
        },
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

      return promise
    },

    /**
     * Delete one team member
     *
     * @param  {Object}   params { id, userId, organizationId }
     * @param  {Function} cb
     */
    deleteTeamMember: function deleteTeamMember (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify()

      const { id, userId, organizationId } = params
      const tasks = [
        (job, next) => {
          Joi.validate({ id, userId, organizationId }, validationRules.deleteTeamMember, (err) => {
            if (err) return next(Boom.badRequest(err))
            next()
          })
        },
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

      return promise
    },

    /**
     * Search for team
     *
     * @param {Object} params { organizationId, query }
     * @param {Function} cb
     */
    search: function search (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      const { organizationId, query, type } = params
      Joi.validate({ organizationId, query }, validationRules.searchTeam, function (err) {
        if (err) {
          return cb(Boom.badRequest(err))
        }

        const sqlQuery = SQL`
          SELECT *
          FROM teams
          WHERE org_id=${organizationId}
          AND (
        `
        if (!type || type === 'default') {
          sqlQuery.append(SQL`
            to_tsvector(name) || to_tsvector(description) @@ to_tsquery(${utils.toTsQuery(query)})
              OR name LIKE(${'%' + query + '%'})
          `)
        } else if (type === 'exact') {
          sqlQuery.append(SQL`
            name = ${query}
          `)
        }

        sqlQuery.append(SQL`)
          ORDER BY id;
        `)

        db.query(sqlQuery, (err, result) => {
          if (err) return cb(Boom.badImplementation(err))
          return cb(null, result.rows.map(mapping.team), result.rows.length)
        })
      })

      return promise
    },

    /**
     * Search for a user in a team
     *
     * @param {Object} params { organizationId, id, query }
     * @param {Function} cb
     */
    searchUsers: function searchUsers (params, cb) {
      let promise = null
      if (typeof cb !== 'function') [promise, cb] = asyncify('data', 'total')

      const { organizationId, id, query } = params
      Joi.validate({ organizationId, id, query }, validationRules.searchTeamUsers, function (err) {
        if (err) {
          return cb(Boom.badRequest(err))
        }

        const sqlQuery = SQL`
          SELECT users.id, users.name
          FROM team_members mem, users
          WHERE mem.team_id = ${id}
          AND mem.user_id = users.id
          AND users.org_id = ${organizationId}
          AND (
            to_tsvector(name) @@ to_tsquery(${utils.toTsQuery(query)})
            OR name ILIKE(${'%' + query + '%'})
            OR id ILIKE(${'%' + query + '%'})
          )
          ORDER BY UPPER(users.name)
        `

        db.query(sqlQuery, (err, result) => {
          if (err) return cb(Boom.badImplementation(err))

          return cb(null, result.rows.map(mapping.user), result.rows.length)
        })
      })

      return promise
    }
  }

  teamOps.search.validate = validationRules.searchTeam
  teamOps.deleteTeamMembers.validate = validationRules.deleteTeamMembers
  teamOps.deleteTeamMember.validate = validationRules.deleteTeamMember
  teamOps.replaceTeamPolicies.validate = validationRules.replaceTeamPolicies
  teamOps.deleteTeamPolicies.validate = validationRules.deleteTeamPolicies
  teamOps.deleteTeamPolicy.validate = validationRules.deleteTeamPolicy
  teamOps.readTeamUsers.validate = validationRules.readTeamUsers
  teamOps.addUsersToTeam.validate = validationRules.addUsersToTeam
  teamOps.replaceUsersInTeam.validate = validationRules.replaceUsersInTeam
  teamOps.listOrgTeams.validate = validationRules.listOrgTeams
  teamOps.createTeam.validate = validationRules.createTeam
  teamOps.readTeam.validate = validationRules.readTeam
  teamOps.updateTeam.validate = validationRules.updateTeam
  teamOps.deleteTeam.validate = validationRules.deleteTeam
  teamOps.moveTeam.validate = validationRules.moveTeam
  teamOps.addTeamPolicies.validate = validationRules.addTeamPolicies
  teamOps.amendTeamPolicies.validate = validationRules.amendTeamPolicies
  teamOps.listNestedTeams.validate = validationRules.listNestedTeams
  teamOps.searchUsers.validate = validationRules.searchUsers
  teamOps.listTeamPolicies.validate = validationRules.listTeamPolicies

  return teamOps
}
module.exports = buildTeamOps
