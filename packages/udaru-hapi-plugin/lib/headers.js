'use strict'

const Joi = require('@hapi/joi')

const headers = Joi.object({
  'authorization': Joi.any().required().description('User ID of the enpoint caller'),
  'org': Joi.any().description('Specify a different organization for the user who is calling the endpoint (works only for SuperUser, it\'s like impersonation).')
}).unknown()

module.exports = headers
