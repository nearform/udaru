'use strict'

const Boom = require('boom')
const async = require('async')
const uuidV4 = require('uuid/v4')
const db = require('./../db')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')
const utils = require('./utils')

const updateUserInfo = (job, next) => {
  const { id, name, organizationId } = job

  const sqlQuery = SQL`
    UPDATE users
    SET name = ${name}
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `
  job.client.query(sqlQuery, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rowCount === 0) return next(Boom.notFound(`User ${id} not found`))

    next()
  })
}

const clearUserTeams = (job, next) => {
  const { id } = job

  const sqlQuery = SQL`
    DELETE FROM team_members
    WHERE user_id = ${id}
  `
  job.client.query(sqlQuery, utils.boomErrorWrapper(next))
}

const addUserTeams = (job, next) => {
  const { id: userId, teams } = job

  const sqlQuery = SQL`
    INSERT INTO team_members (
      team_id, user_id
    ) VALUES
  `
  sqlQuery.append(SQL`(${teams[0]}, ${userId})`)
  teams.slice(1).forEach((teamId) => {
    sqlQuery.append(SQL`, (${teamId}, ${userId})`)
  })

  job.client.query(sqlQuery, utils.boomErrorWrapper(next))
}

const clearUserPolicies = (job, next) => {
  const { id } = job

  const sqlQuery = SQL`
    DELETE FROM user_policies
    WHERE user_id = ${id}
  `
  job.client.query(sqlQuery, utils.boomErrorWrapper(next))
}

const removeUserPolicy = (job, next) => {
  const { id, policyId } = job

  const sqlQuery = SQL`
    DELETE FROM user_policies
    WHERE user_id = ${id}
    AND policy_id = ${policyId}
  `
  job.client.query(sqlQuery, utils.boomErrorWrapper(next))
}

const insertUserPolicies = (job, next) => {
  const { id: userId, policies } = job

  userOps.insertPolicies(job.client, userId, policies, utils.boomErrorWrapper(next))
}

function checkTeamsOrg (job, next) {
  const { teams, organizationId } = job

  job.client.query(SQL`SELECT id FROM teams WHERE id = ANY (${teams}) AND org_id = ${organizationId}`, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rowCount !== teams.length) return next(Boom.badRequest(`Some of the teams [${teams.join(',')}] were not found`))

    next()
  })
}

function checkUserOrg (job, next) {
  const { id, organizationId } = job

  userOps.readUser({ id, organizationId }, utils.boomErrorWrapper(next))
}

function checkPoliciesOrg (job, next) {
  const { client, policies, organizationId } = job

  client.query(SQL`SELECT id FROM policies WHERE id = ANY (${policies}) AND org_id = ${organizationId}`, (err, result) => {
    if (err) return next(Boom.badImplementation(err))
    if (result.rowCount !== policies.length) return next(Boom.badRequest(`Some of the policies [${policies.join(',')}] were not found`))

    next()
  })
}

const userOps = {
  /**
   * Get organization users, in alphabetical order
   *
   * @param  {Object}   params { organizationId }
   * @param  {Function} cb
   */
  listOrgUsers: function listOrgUsers (params, cb) {
    const { organizationId } = params

    const sqlQuery = SQL`
      SELECT  *
      FROM users
      WHERE org_id = ${organizationId}
      ORDER BY UPPER(name)
    `
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(err)

      return cb(null, result.rows.map(mapping.user))
    })
  },

  /**
   * Insert a new user into the database
   *
   * @param  {Object}      client
   * @param  {String|null} options.id
   * @param  {String}      options.name
   * @param  {String}      options.organizationId
   * @param  {Function}    cb
   */
  insertUser: function insertUser (client, { id, name, organizationId }, cb) {
    id = id || uuidV4()

    const sqlQuery = SQL`
      INSERT INTO users (
        id, name, org_id
      ) VALUES (
        ${id}, ${name}, ${organizationId}
      )
      RETURNING id
    `

    client.query(sqlQuery, utils.boomErrorWrapper(cb))
  },

  insertPolicies: function insertPolicies (client, id, policies, cb) {
    const sqlQuery = SQL`
      INSERT INTO user_policies (
        policy_id, user_id
      ) VALUES
    `
    sqlQuery.append(SQL`(${policies[0]}, ${id})`)
    policies.slice(1).forEach((policyId) => {
      sqlQuery.append(SQL`, (${policyId}, ${id})`)
    })
    sqlQuery.append(SQL` ON CONFLICT ON CONSTRAINT user_policy_link DO NOTHING`)

    client.query(sqlQuery, utils.boomErrorWrapper(cb))
  },

  organizationExists: function organizationExists (id, cb) {
    const sqlQuery = SQL`
      SELECT id
      FROM organizations
      WHERE id = ${id}
    `
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(err)

      return cb(null, result.rowCount !== 0)
    })
  },

  /**
   * Create a new user
   *
   * @param  {Object}   params { id, name, organizationId } "id" can be null
   * @param  {Function} cb
   */
  createUser: function createUser (params, cb) {
    const { id, name, organizationId } = params

    userOps.organizationExists(organizationId, (err, res) => {
      if (err) return cb(Boom.badImplementation(err))
      if (!res) return cb(Boom.badRequest(`Organization '${organizationId}' does not exists`))

      userOps.insertUser(db, { id, name, organizationId }, (err, result) => {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUser({ id: result.rows[0].id, organizationId }, utils.boomErrorWrapper(cb))
      })
    })
  },

  /**
   * Return the user organizationId
   *
   * @param  {Number}   id
   * @param  {Function} cb
   */
  getUserOrganizationId: function getUserOrganizationId (id, cb) {
    const sqlQuery = SQL`
      SELECT org_id
      FROM users
      WHERE id = ${id}
    `
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))
      if (result.rowCount === 0) return cb(Boom.notFound())

      return cb(null, result.rows[0].org_id)
    })
  },

  /**
   * Get user details
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb
   */
  readUser: function readUser (params, cb) {
    const { id, organizationId } = params
    let user

    const tasks = []

    tasks.push((next) => {
      const sqlQuery = SQL`
        SELECT id, name, org_id
        FROM users
        WHERE id = ${id}
        AND org_id = ${organizationId}
      `
      db.query(sqlQuery, (err, result) => {
        if (err) return next(Boom.badImplementation(err))
        if (result.rowCount === 0) return next(Boom.notFound(`User ${id} not found`))

        user = mapping.user(result.rows[0])
        next()
      })
    })

    tasks.push((next) => {
      const sqlQuery = SQL`
        SELECT teams.id, teams.name
        FROM team_members mem, teams
        WHERE mem.user_id = ${id} AND mem.team_id = teams.id
        ORDER BY UPPER(teams.name)
      `
      db.query(sqlQuery, (err, result) => {
        if (err) return next(Boom.badImplementation(err))

        user.teams = result.rows.map(mapping.team.simple)
        next()
      })
    })

    tasks.push((next) => {
      const sqlQuery = SQL`
        SELECT pol.id, pol.name, pol.version
        FROM user_policies user_pol, policies pol
        WHERE user_pol.user_id = ${id} AND user_pol.policy_id = pol.id
        ORDER BY UPPER(pol.name)
      `
      db.query(sqlQuery, (err, result) => {
        if (err) return next(Boom.badImplementation(err))

        user.policies = result.rows.map(mapping.policy.simple)
        next()
      })
    })

    async.series(tasks, (err) => {
      if (err) return cb(err)

      return cb(null, user)
    })
  },

  /**
   * Update user details
   *
   * @param  {Object}   params { id, organizationId, name, teams }
   * @param  {Function} cb
   */
  updateUser: function updateUser (params, cb) {
    const { id, organizationId, name, teams } = params

    const tasks = [
      (job, next) => {
        job.id = id
        job.name = name
        job.teams = teams
        job.organizationId = organizationId

        next()
      },
      updateUserInfo,
      clearUserTeams
    ]

    if (teams.length > 0) {
      tasks.push(checkTeamsOrg)
      tasks.push(addUserTeams)
    }

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(err)
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Replace user poilicies
   *
   * @param  {Object}   params { id, organizationId, policies }
   * @param  {Function} cb
   */
  replaceUserPolicies: function replaceUserPolicies (params, cb) {
    const { id, organizationId, policies } = params
    const tasks = [
      (job, next) => {
        job.id = id
        job.organizationId = organizationId
        job.policies = policies

        next()
      },
      checkUserOrg,
      clearUserPolicies
    ]

    if (policies.length > 0) {
      tasks.push(checkPoliciesOrg)
      tasks.push(insertUserPolicies)
    }

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(err)
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Add one or more policies to a user
   *
   * @param  {Object}   params { id, organizationId, policies }
   * @param  {Function} cb
   */
  addUserPolicies: function addUserPolicies (params, cb) {
    const { id, organizationId, policies } = params
    if (policies.length <= 0) {
      return userOps.readUser({ id, organizationId }, cb)
    }

    const tasks = [
      (job, next) => {
        job.id = id
        job.policies = policies
        job.organizationId = organizationId

        next()
      },
      checkUserOrg,
      checkPoliciesOrg,
      insertUserPolicies
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Rmove all user's policies
   *
   * @param  {Object}   params { id, organizationId }
   * @param  {Function} cb
   */
  deleteUserPolicies: function deleteUserPolicies (params, cb) {
    const { id, organizationId } = params
    const tasks = [
      (job, next) => {
        job.id = id
        job.organizationId = organizationId

        next()
      },
      checkUserOrg,
      clearUserPolicies
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(err)
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Rmove all user's policies
   *
   * @param  {Object}   params { userId, organizationId, policyId }
   * @param  {Function} cb
   */
  deleteUserPolicy: function deleteUserPolicy (params, cb) {
    const { userId, organizationId, policyId } = params
    const tasks = [
      (job, next) => {
        job.id = userId
        job.policyId = policyId
        job.organizationId = organizationId

        next()
      },
      checkUserOrg,
      removeUserPolicy
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(err)
      }

      userOps.readUser({ id: userId, organizationId }, cb)
    })
  },

  /**
   * Delete user
   *
   * @param  {params}   { id, organizationId }
   * @param  {Function} cb
   */
  deleteUser: function deleteUser (params, cb) {
    const { id, organizationId } = params
    const tasks = [
      (job, next) => {
        job.id = id
        next()
      },
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM user_policies WHERE user_id = ${id}`

        job.client.query(sqlQuery, utils.boomErrorWrapper(next))
      },
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${id}`

        job.client.query(sqlQuery, utils.boomErrorWrapper(next))
      },
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM users WHERE id = ${id} AND org_id = ${organizationId}`

        job.client.query(sqlQuery, (err, result) => {
          if (err) return next(Boom.badImplementation(err))
          if (result.rowCount === 0) return next(Boom.notFound(`User ${id} not found`))

          next()
        })
      }
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) return cb(err)

      cb()
    })
  }
}

module.exports = userOps
