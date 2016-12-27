const jsonfile = require('jsonfile')
const minimist = require('minimist')
const db = require('./../lib/db')
const policyOps = require('./../lib/ops/policyOps')
const organizationOps = require('./../lib/ops/organizationOps')

const exit = (message, db) => {
  console.log(message)
  if (db) {
    db.shutdown(() => {
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

  db.withTransaction(tasks, (err, x) => {
    if (err) {
      return exit(err, db)
    }

    db.shutdown(() => {
      console.log('Done!')
    })
  })
})
