const async = require('async')
const pg = require('pg')
const data = require('./policies')

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
const config = {
  user: 'postgres', // env var: PGUSER
  database: 'authorization', // env var: PGDATABASE
  password: 'postgres', // env var: PGPASSWORD
  host: 'localhost' // Server hosting the postgres database
}

const client = new pg.Client(config)

const insertData = (data, done) => {
  client.query('INSERT INTO policies (version, name, org_id, statements) VALUES ($1, $2, $3, $4)', data, (err, result) => {
    console.log('Inserting %s', data[1])
    if (err) {
      console.error(err)
      return done(err)
    }
    return done()
  })
}

const truncateTable = (tableName) => {
  console.log('truncating %s', tableName)
  client.query('TRUNCATE ' + tableName + ' CASCADE',  (err, result) => {
    if (err) throw (err)
  })
}

// connect to our database
client.connect((err) => {
  if (err) throw err
  // Remove existing data from the table
  truncateTable('policies')
  // Load our test data
  async.eachSeries(data, insertData, (err) => {
    console.log('...done.')
    if (err) throw err
    client.query('SELECT * FROM policies', (err, result) => {
      if (err) throw err
    })
    // disconnect the client
    client.end((err) => {
      if (err) throw err
    })
  })
})
