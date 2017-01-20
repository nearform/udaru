'use strict'

const Joi = require('joi')

const headers = Joi.object({
  'authorization': Joi.any().required().description('user id of who is calling the enpoint'),
  'org': Joi.any().description('Specify a different organization for the user who is calling the endpoint (works only for SuperUser, it\'s like impersonation)')
}).unknown()

module.exports = headers
