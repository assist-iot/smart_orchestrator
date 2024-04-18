import { Container } from 'typedi'
import { Logger } from 'winston'
import Joi from 'joi'

const validationPublicRepo = async (req, res, next) => {
  const Logger : Logger = Container.get('logger')
  let validation
  try {
    Logger.info('💊 Middleware validation Public repo fired')
      
    const schemas = {
      repoPOST: Joi.object().keys({
        name: Joi.string().required(),
        url: Joi.string().required(),
        description: Joi.string().required()
      })
    }

    validation = schemas.repoPOST.validate(req.body)
    
    if(validation.error){
      Logger.error('💊 Middleware validation Public repo error')
      let errorDetails = validation.error.details.map(({ message }) => ({ message }))
      return res.status(400).json({code: 400,message: errorDetails})
    }
    return next()
  } catch (e) {
    Logger.error('🔥 Error: %o', e)
    return next(e)
  }
}

export default validationPublicRepo
