'use strict'

const Reconfig = require('reconfig')
const fs = require('fs')
const path = require('path')

const config = new Reconfig({
  api: {
    basUrl: 'http://localhost:8000'
  }
}, { envPrefix: 'LABS_AUTH_COMPONENT' })

try {
  let content = fs.readFileSync(path.join(__dirname, 'config.template'), 'utf8')
  content = content.replace('{{config}}', JSON.stringify(config._rawConfig))

  fs.writeFileSync(path.join(__dirname, '../config.js'), content)
} catch (err) {
  console.log(err)
  throw err
}
