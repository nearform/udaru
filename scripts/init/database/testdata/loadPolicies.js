var async = require('async')
var pg = require('pg')

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
  user: 'postgres', // env var: PGUSER
  database: 'authorization', // env var: PGDATABASE
  password: 'postgres', // env var: PGPASSWORD
  host: 'localhost' // Server hosting the postgres database
}

var client = new pg.Client(config)

var data = [
  [0.1, 'Administrator', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Read anything', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Confidential', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.1, 'Company secret', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ],
  [0.2, 'Developer', 'WONKA', {
    'Statement':
      [
        {
          'Effect': 'Allow',
          'Action': ['iam:ChangePassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Deny',
          'Action': ['iam:ChangeAdminPassword'],
          'Resource': ['*']
        },
        {
          'Effect': 'Allow',
          'Action': [
            'files:List',
            'files:Edit'
          ],
          'Resource': [
            'filestore:dev:project-data',
            'filestore:dev:common-repo'
          ]
        }
      ]}
  ]
]

var insertData = function (data, done) {
  client.query('INSERT INTO policies (version, name, org_id, statements) VALUES ($1, $2, $3, $4)', data, function (err, result) {
    console.log('Inserting %s', data[1])
    if (err) {
      console.error(err)
      return done(err)
    }
    return done()
  })
}

var truncateTable = function (tableName) {
  console.log('truncating %s', tableName)
  client.query('TRUNCATE ' + tableName + ' CASCADE', function (err, result) {
    if (err) throw (err)
  })
}

// connect to our database
client.connect(function (err) {
  if (err) throw err
  // Remove existing data from the table
  truncateTable('policies')
  // Load our test data
  async.eachSeries(data, insertData, function (err) {
    console.log('...done.')
    if (err) throw err
    client.query('SELECT * FROM policies', function (err, result) {
      if (err) throw err
      console.log(result.rows)
    })
    // disconnect the client
    client.end(function (err) {
      if (err) throw err
    })
  })
})
