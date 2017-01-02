const config = require('./../lib/config')
const db = require('./../lib/db')
const SQL = require('./../lib/db/SQL')

const organizationOps = require('./../lib/ops/organizationOps')
const userOps = require('./../lib/ops/userOps')
const policyOps = require('./../lib/ops/policyOps')

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
    token: config.get('authorization.superUser.token'),
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
  db.query(sqlQuery, next)
}

const tasks = [
  createOrganization,
  createUser,
  createPolicy,
  attachPolicy
]
db.withTransaction(tasks, (error, x) => {
  if (error) {
    console.log(error)
    process.exit()
  }

  db.shutdown(() => {
    console.log('done')
  })
})
