const dbConn = require('./../lib/dbConn')
const dbUtil = require('./../lib/dbUtil')
const db = dbConn.create(console)

const OrganizationOps = require('./../lib/organizationOps')
const TeamOps = require('./../lib/teamOps')
const UserOps = require('./../lib/userOps')
const PolicyOps = require('./../lib/policyOps')

const organizationOps = OrganizationOps(db.pool, console)
const teamOps = TeamOps(db.pool, console)
const userOps = UserOps(db.pool, console)
const policyOps = PolicyOps(db.pool, console)

const createOrganization = (job, next) => {
  const SuperOrganization = {
    id: 'ROOT',
    name: 'SuperOrganization',
    description: 'SuperAdmin Organization'
  }

  organizationOps.create(SuperOrganization, { createOnly: true }, (error, result) => {
    job.organization = result.organization

    next(error)
  })
}

const createTeam = (job, next) => {
  const { organization } = job
  const SuperTeam = {
    name: 'Super Team',
    description: 'SuperAdmin Team',
    teamParentId: null,
    organizationId: organization.id
  }
  teamOps.createTeam(SuperTeam, { createOnly: true }, (error, team) => {
    job.team = team

    next(error)
  })
}

const createUser = (job, next) => {
  const { organization } = job
  const SuperAdmin = {
    name: 'SuperAdmin',
    organizationId: organization.id
  }
  userOps.createUser(SuperAdmin, (error, user) => {
    job.user = user

    next(error)
  })
}

const createPolicy = (job, next) => {
  const { organization } = job

  // const superAdminPolicy = {
  //   version: 1,
  //   name: 'SuperAdmin',
  //   organizationId: organization.id,
  //   statements: {
  //     Statement: [{
  //       Effect: 'Allow',
  //       Action: ['*'],
  //       Resource: ['*']
  //     }]
  //   }
  // }

  const superAdminPolicy = [
    1,
    'SuperAdmin',
    organization.id,
    JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: ['*'],
        Resource: ['*']
      }]
    })
  ]
  policyOps.createPolicy(superAdminPolicy, (error, policy) => {
    job.policy = policy

    next(error)
  })
}

const attachPolicy = (job, next) => {
  const { user, policy } = job

  const query = 'INSERT INTO user_policies (user_id, policy_id) VALUES ($1, $2)'
  db.pool.query(query, [user.id, policy.id], next)
}

const tasks = [
  createOrganization,
  createTeam,
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
