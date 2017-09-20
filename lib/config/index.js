
const Reconfig = require('reconfig')

function buildConfig (defaultConfig, ...configs) {
  const reconfig = new Reconfig(defaultConfig, { envPrefix: 'UDARU_SERVICE' })

  if (configs) {
    configs.forEach(function addConfig (config) {
      // support passing a reconfig object
      if (config._config) {
        reconfig.set(config._config)
      } else {
        reconfig.set(config)
      }
    })
  }

  return reconfig
}

module.exports = buildConfig
