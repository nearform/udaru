'user strict'

// const config = require('./config')
// to be fixed config.get('logger.pino') || {}
const logger = require('pino')()

module.exports = logger
