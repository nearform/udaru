'use strict'

const Boom = require('boom')
const async = require('async')
const db = require('./../db')
const SQL = require('./../db/SQL')
const mapping = require('./../mapping')

function getUserTeams (client, id, cb) {
  const sqlQuery = SQL`
    SELECT teams.id, teams.name
    FROM team_members mem, teams
    WHERE mem.user_id = ${id} AND mem.team_id = teams.id
    ORDER BY UPPER(teams.name)
  `
  client.query(sqlQuery, (err, result) => {
    if (err) {
      return cb(err)
    }

    cb(null, result.rows.map(mapping.team.simple))
  })
}

function getUser (client, id, organizationId, cb) {
  const sqlQuery = SQL`
    SELECT id, name, token, org_id
    FROM users
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `

  client.query(sqlQuery, (err, result) => {
    if (err) return cb(err)
    if (result.rowCount === 0) return cb(Boom.notFound())

    cb(null, mapping.user(result.rows[0]))
  })
}

function getUserPolicies (client, id, cb) {
  const sqlQuery = SQL`
    SELECT pol.id, pol.name, pol.version
    FROM user_policies user_pol, policies pol
    WHERE user_pol.user_id = ${id} AND user_pol.policy_id = pol.id
    ORDER BY UPPER(pol.name)
  `
  client.query(sqlQuery, (err, result) => {
    if (err) return cb(err)

    cb(null, result.rows.map(mapping.policy.simple))
  })
}

const updateUserInfo = (job, next) => {
  const { id, name, organizationId } = job

  const sqlQuery = SQL`
    UPDATE users
    SET name = ${name}
    WHERE id = ${id}
    AND org_id = ${organizationId}
  `
  job.client.query(sqlQuery, (err, result) => {
    if (err) {
      return next(err)
    }
    if (result.rowCount === 0) {
      return next(Boom.notFound())
    }

    next()
  })
}

const clearUserTeams = (job, next) => {
  const { id } = job

  const sqlQuery = SQL`
    DELETE FROM team_members
    WHERE user_id = ${id}
  `
  job.client.query(sqlQuery, next)
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

  job.client.query(sqlQuery, next)
}

const clearUserPolicies = (job, next) => {
  const { id } = job

  const sqlQuery = SQL`
    DELETE FROM user_policies
    WHERE user_id = ${id}
  `
  job.client.query(sqlQuery, next)
}

const removeUserPolicy = (job, next) => {
  const { id, policyId } = job

  const sqlQuery = SQL`
    DELETE FROM user_policies
    WHERE user_id = ${id}
    AND policy_id = ${policyId}
  `
  job.client.query(sqlQuery, next)
}

const insertUserPolicies = (job, next) => {
  const { id: userId, policies } = job

  userOps.insertPolicies(job.client, userId, policies, next)
}

const fetchUserByToken = (client, token, cb) => {
  const sqlQuery = SQL`SELECT * FROM users WHERE token = ${token}`

  client.query(sqlQuery, (err, res) => {
    if (err) return cb(Boom.badImplementation(err))
    if (res.rowCount === 0) return cb(Boom.notFound())

    cb(null, mapping.user(res.rows[0]))
  })
}

const fetchUserId = (job, next) => {
  fetchUserByToken(job.client, job.token, (err, user) => {
    if (err) return next(err)

    job.id = user.id
    next()
  })
}

const fetchUserIdFromToken = (client, token, cb) => {
  fetchUserByToken(client, token, (err, user) => {
    if (err) return cb(err)

    cb(null, user.id)
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
      if (err) return cb(Boom.badImplementation(err))

      return cb(null, result.rows.map(mapping.user))
    })
  },

  insertUser: function insertUser (client, name, token, organizationId, cb) {
    const sqlQuery = SQL`
      INSERT INTO users (
        id, name, token, org_id
      ) VALUES (
        DEFAULT, ${name}, ${token}, ${organizationId}
      )
      RETURNING id
    `

    client.query(sqlQuery, cb)
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

    client.query(sqlQuery, cb)
  },

  organizationExists: function organizationExists (id, cb) {
    const sqlQuery = SQL`
      SELECT id
      FROM organizations
      WHERE id = ${id}
    `
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))

      return cb(null, result.rowCount !== 0)
    })
  },

  /**
   * Create a new user
   *
   * @param  {Object}   params { name, token, organizationId }
   * @param  {Function} cb
   */
  createUser: function createUser (params, cb) {
    const { name, token, organizationId } = params

    userOps.organizationExists(organizationId, (err, res) => {
      if (err) return cb(Boom.badImplementation(err))
      if (!res) return cb(Boom.badRequest(`Organization '${organizationId}' does not exists`))

      userOps.insertUser(db, name, token, organizationId, (err, result) => {
        if (err) return cb(Boom.badImplementation(err))

        userOps.readUser({ id: result.rows[0].id, organizationId }, cb)
      })
    })
  },

  /**
   * Create a new user (allows passing in of ID for test purposes)
   *
   * @param  {Object}   params { id, name, organizationId }
   * @param  {Function} cb
   */
  createUserById: function createUserById (params, cb) {
    const { id, name, token, organizationId } = params

    const sqlQuery = SQL`
      INSERT INTO users (
        id, name, token, org_id
      ) VALUES (
        ${id}, ${name}, ${token}, ${organizationId}
      )
    `
    db.query(sqlQuery, function (err, result) {
      if (err) return cb(Boom.badImplementation(err))

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Return the user organizationId
   *
   * @param  {String}   token
   * @param  {Function} cb
   */
  getUserOrganizationId: function getUserOrganizationId (token, cb) {
    fetchUserByToken(db, token, (err, user) => {
      if (err) return cb(err)

      return cb(null, user.organizationId)
    })
  },

  /**
   * Fetch the user id given her token
   *
   * @param  {String}   token [description]
   * @param  {Function} cb    [description]
   */
  getIdFromToken: function getIdFromToken (token, cb) {
    fetchUserIdFromToken(db, token, cb)
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
      getUser(db, id, organizationId, (err, u) => {
        user = u
        next(err)
      })
    })

    tasks.push((next) => {
      getUserTeams(db, id, (err, teams) => {
        user.teams = teams
        next(err)
      })
    })

    tasks.push((next) => {
      getUserPolicies(db, id, (err, policies) => {
        user.policies = policies
        next(err)
      })
    })

    async.series(tasks, (err) => {
      if (err) {
        return cb(err.isBoom ? err : Boom.badImplementation(err))
      }

      return cb(null, user)
    })
  },


  /**
   * Get user data
   *
   * @param  {Object}   params { token }
   * @param  {Function} cb
   */
  readUserByToken: function readUserByToken (params, cb) {
    const { token } = params
    fetchUserByToken(db, token, (err, user) => {
      if (err) return cb(err)

      return cb(null, user)
    })
  },

  /**
   * Update user details
   *
   * @param  {Object}   params { token, organizationId, name, teams }
   * @param  {Function} cb
   */
  updateUser: function updateUser (params, cb) {
    let id
    const { token, organizationId, name, teams } = params
    const tasks = [
      (job, next) => {
        job.token = token
        job.name = name
        job.teams = teams
        job.organizationId = organizationId

        next()
      },
      fetchUserId,
      updateUserInfo
    ]

    tasks.push(clearUserTeams)
    if (teams.length > 0) {
      tasks.push(addUserTeams)
    }
    tasks.push((job, next) => {
      id = job.id
      next()
    })

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Replace user poilicies
   *
   * @param  {Object}   params { token, organizationId, policies }
   * @param  {Function} cb
   */
  replaceUserPolicies: function replaceUserPolicies (params, cb) {
    let id
    const { token, organizationId, policies } = params
    const tasks = [
      (job, next) => {
        job.token = token
        job.organizationId = organizationId
        job.policies = policies

        next()
      },
      fetchUserId,
      clearUserPolicies
    ]

    if (policies.length > 0) {
      tasks.push(insertUserPolicies)
    }

    tasks.push((job, next) => {
      id = job.id
      next()
    })

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Add one or more policies to a user
   *
   * @param  {Object}   params { token, organizationId, policies }
   * @param  {Function} cb
   */
  addUserPolicies: function addUserPolicies (params, cb) {
    const { token, organizationId, policies } = params
    fetchUserIdFromToken(db, token, (err, id) => {
      if (err) return cb(err)

      if (policies.length <= 0) {
        return userOps.readUser({ id, organizationId }, cb)
      }

      const tasks = [
        (job, next) => {
          job.id = id
          job.policies = policies

          next()
        },
        insertUserPolicies
      ]

      db.withTransaction(tasks, (err, res) => {
        if (err) {
          return cb(Boom.badImplementation(err))
        }

        userOps.readUser({ id, organizationId }, cb)
      })
    })
  },

  /**
   * Rmove all user's policies
   *
   * @param  {Object}   params { token, organizationId }
   * @param  {Function} cb
   */
  deleteUserPolicies: function deleteUserPolicies (params, cb) {
    let id
    const { token, organizationId } = params
    const tasks = [
      (job, next) => {
        job.token = token

        next()
      },
      fetchUserId,
      clearUserPolicies,
      (job, next) => {
        id = job.id
        next()
      }
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Rmove all user's policies
   *
   * @param  {Object}   params { token, organizationId, policyId }
   * @param  {Function} cb
   */
  deleteUserPolicy: function deleteUserPolicy (params, cb) {
    let id
    const { token, organizationId, policyId } = params
    const tasks = [
      (job, next) => {
        job.token = token
        job.policyId = policyId

        next()
      },
      fetchUserId,
      removeUserPolicy,
      (job, next) => {
        id = job.id
        next()
      }
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      userOps.readUser({ id, organizationId }, cb)
    })
  },

  /**
   * Delete user
   *
   * @param  {params}   { token, organizationId }
   * @param  {Function} cb
   */
  deleteUser: function deleteUser (params, cb) {
    const { token, organizationId } = params
    const tasks = [
      (job, next) => {
        job.token = token
        next()
      },
      fetchUserId,
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM user_policies WHERE user_id = ${job.id}`

        job.client.query(sqlQuery, next)
      },
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM team_members WHERE user_id = ${job.id}`

        job.client.query(sqlQuery, next)
      },
      (job, next) => {
        const sqlQuery = SQL`DELETE FROM users WHERE id = ${job.id} AND org_id = ${organizationId}`

        job.client.query(sqlQuery, (err, result) => {
          if (err) {
            return next(err)
          }

          next()
        })
      }
    ]

    db.withTransaction(tasks, (err, res) => {
      if (err) {
        return cb(Boom.badImplementation(err))
      }

      cb()
    })
  }
}

module.exports = userOps
