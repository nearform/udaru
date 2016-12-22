const jsonfile = require('jsonfile')
const minimist = require('minimist')

const dbConn = require('./../lib/dbConn')
const dbUtil = require('./../lib/dbUtil')
const db = dbConn.create(console)

const OrganizationOps = require('./../lib/organizationOps')
const organizationOps = OrganizationOps(db.pool, console)

const PolicyOps = require('./../lib/policyOps')
const policyOps = PolicyOps(db.pool, console)

const exit = (message, db) => {
  console.log(message)
  if (db) {
    db.shutdown({}, () => {
      process.exit()
    })
  }

  process.exit()
}

const argv = minimist(process.argv.slice(2))

const organizationId = argv.org
if (!organizationId) {
  exit('Please provide the organization id')
}

const source = argv.src || argv._[0]
if (!source) {
  exit('Please provide a file')
}

const input = jsonfile.readFileSync(source, { throws: false })
if (!input || !input.policies) {
  exit('Invalid json')
}

organizationOps.readById(organizationId, (error, organization) => {
  if (error || !organization) {
    exit('Please provide a valid organization', db)
  }

  const tasks = input.policies.map((policy) => {
    const policyData = {
      version: policy.version,
      name: policy.name,
      organizationId: organizationId,
      statements: JSON.stringify({ Statement: policy.statements })
    }
    return (job, next) => policyOps.createPolicy(policyData, next)
  })

  dbUtil.withTransaction(db.pool, tasks, (err, x) => {
    if (err) {
      exit(err, db)
    }

    db.shutdown({}, () => {
      console.log('Done!')
    })
  })
})
