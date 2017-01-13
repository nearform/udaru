var postgrator = require('postgrator')
var config = require('./../../../service/lib/config')

postgrator.setConfig({
  migrationDirectory: __dirname + '/migrations',
  schemaTable: 'schemaversion', // optional. default is 'schemaversion'
  driver: 'pg', // or mysql, mssql
  host: config.get('pgdb.host', '127.0.0.1'),
  port: config.get('pgdb.port', 5432), // optionally provide port
  database: config.get('pgdb.database', 'authorization'),
  username: config.get('pgdb.user', 'postgres'),
  password: config.get('pgdb.password', 'postgres')
})

postgrator.migrate('001', function (err, migrations) {
  if (err) {
    console.log(err)
  } else {
    console.log(migrations)
  }
  postgrator.endConnection(function () {
      // connection is closed, or will close in the case of SQL Server
  })
})
