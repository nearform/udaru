const udaru = require('../index.js')()
udaru.organizations.list({}, (err, orgs) => {
  if (err) {
    console.error(err)
  } else {
    console.log(orgs)
  }

  udaru.db.close()
})
