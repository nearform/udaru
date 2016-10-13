var async = require('async')
var pg = require('pg')

// create a config to configure both pooling behavior
// and client options
// note: all config is optional and the environment variables
// will be read if the config is not present
var config = {
  user: 'postgres', //env var: PGUSER
  database: 'authorization', //env var: PGDATABASE
  password: 'postgres', //env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
}

var client = new pg.Client(config)

var users = [
  'Charlie Bucket',
  'Grandpa Joe',
  'Veruca Salt',
  'Willy Wonka'
]

var insertUser = function (userName, done) {
  client.query('INSERT INTO users (name) VALUES ($1)', [userName], function (err, result) {
    console.log('Inserting %s', userName)
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
  truncateTable('users')
  // Load our test data
  async.eachSeries(users, insertUser, function (err) {
    console.log('...done.')
    if (err) throw err
    client.query('SELECT * FROM users', function (err, result) {
      if (err) throw err
      console.log(result.rows);
    })
    // disconnect the client
    client.end(function (err) {
      if (err) throw err
    })
  })
})
