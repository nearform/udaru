'user strict'

const config = require('./../config')
const logger = require('pino')(config.get('logger.pino') || {})

module.exports = logger
