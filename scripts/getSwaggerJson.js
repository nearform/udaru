const start = require('../packages/hapi-auth-udaru/lib/standalone/server')
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

start()
  .then(async server => {
    const response = await server.inject({method: 'GET', url: '/swagger.json'})

    Joi.validate(response.result, swaggerSchema, {allowUnknown: true}, (err) => {
      if (err) {
        console.error('Error validating swagger definition', err)
        process.exit(1)
      }
      console.log(JSON.stringify(response.result))
      process.exit(0)
    })
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
