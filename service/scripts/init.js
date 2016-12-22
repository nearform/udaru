const config = require('./../lib/config')
const dbConn = require('./../lib/dbConn')
const dbUtil = require('./../lib/dbUtil')

const db = dbConn.create(console)
const SQL = dbUtil.SQL

const OrganizationOps = require('./../lib/organizationOps')
const UserOps = require('./../lib/userOps')
const PolicyOps = require('./../lib/policyOps')

const organizationOps = OrganizationOps(db.pool, console)
const userOps = UserOps(db.pool, console)
const policyOps = PolicyOps(db.pool, console)

function createOrganization (job, next) {
  const superOrganizationData = config.get('authorization.superUser.organization')

  organizationOps.create(superOrganizationData, { createOnly: true }, (error, result) => {
    job.organization = result.organization

    next(error)
  })
}

function createUser (job, next) {
  const { organization } = job

  const superUserData = {
    name: config.get('authorization.superUser.name'),
    organizationId: organization.id
  }

  userOps.createUser(superUserData, (error, user) => {
    job.user = user

    next(error)
  })
}

function createPolicy (job, next) {
  const { organization } = job

  const superUserPolicy = config.get('authorization.superUser.defaultPolicy', { organizationId: organization.id })

  policyOps.createPolicy(superUserPolicy, (error, policy) => {
    job.policy = policy

    next(error)
  })
}

function attachPolicy (job, next) {
  const { user, policy } = job

  const sqlQuery = SQL`INSERT INTO user_policies (user_id, policy_id) VALUES (${user.id}, ${policy.id})`
  db.pool.query(sqlQuery, next)
}

const tasks = [
  createOrganization,
  createUser,
  createPolicy,
  attachPolicy
]
dbUtil.withTransaction(db.pool, tasks, (error, x) => {
  if (error) {
    console.log(error)
    process.exit()
  }

  db.shutdown({}, () => {
    console.log('done')
  })
})
