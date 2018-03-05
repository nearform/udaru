'use strict'

var fs = require('fs')
fs.readFile('./docs/swagger/index.html', 'utf8', function (err, data) {
  if (err) {
    return console.log(err)
  }

  var replace = '<link rel="stylesheet" type="text/css" href="./swagger-ui.css" >\n\t' +
    '<link rel="stylesheet" type="text/css" href="./swagger-udaru.css" >'

  if (data.indexOf(replace) !== -1) return console.log('already injected css reference')

  var result = data.replace('<link rel="stylesheet" type="text/css" href="./swagger-ui.css" >', replace)

  fs.writeFile('./docs/swagger/index.html', result, 'utf8', function (err) {
    if (err) return console.log(err)

    return console.log('success injecting css reference')
  })
})
