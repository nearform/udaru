// if using outside this repo, use require('@nearform/udaru-core')
const udaru = require('../index.js')()

udaru.addHook('authorize:isUserAuthorized', function (error, args, result, done) {
  if (error) {
    console.error(`Authorization errored: ${error}`)
    return done(error)
  }

  console.log(`Access to ${args[0]} got access: ${result[0].access}`)
  done()
})

udaru.authorize.isUserAuthorized('resource', 'action', 'uid', 'oid', (err, result) => {
  console.log(err, result.access)
  udaru.db.close()
})
