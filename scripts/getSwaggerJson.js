const Joi = require('joi')

const swaggerSchema = Joi.object({
  swagger: Joi.string(),
  host: Joi.string(),
  basePath: Joi.string(),
  schemes: Joi.array(),
  info: Joi.object(),
  tags: Joi.array(),
  paths: Joi.object(),
  definitions: Joi.object()
})

require('../packages/udaru-hapi-server').inject({method: 'GET', url: '/swagger.json'}, (response) => {
  Joi.validate(response.result, swaggerSchema, {allowUnknown: true}, (err) => {
    if (err) {
      console.error('Error validating swagger definition', err)
      process.exit(1)
    }
    console.log(JSON.stringify(response.result))
    process.exit(0)
  })
})
