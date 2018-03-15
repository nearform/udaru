'user strict'

const pino = require('pino')

module.exports = function buildLogger (config) {
  return pino(config.get('logger.pino') || {})
}
