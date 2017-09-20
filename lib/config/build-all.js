
const buildConfig = require('./index')

module.exports = function buildAll () {
  return buildConfig({},
    require('./default.core'),
    require('./default.plugin'),
    require('./default.server')
  )
}
