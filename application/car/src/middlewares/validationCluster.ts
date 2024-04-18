import { Container } from 'typedi';
import { Logger } from 'winston';
import Joi from 'joi';

const validationCluster = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  let validation;
  try {
    Logger.info('💊 Middleware validation Cluster fired')
    
    const clusterSchema = Joi.object().keys({
      cluster: Joi.object().required(),
      name: Joi.string().required()
    });
    
    const contextSchema = Joi.object().keys({
      context: Joi.object().keys({
        cluster: Joi.string().required(),
        user: Joi.string().required()
      }).required(),
      name: Joi.string().required()
    });
    
    const userSchema = Joi.object().keys({
      name: Joi.string().required(),
      user: Joi.object().required()
    });
    
    const credentialsSchema = Joi.object().keys({
      apiVersion: Joi.string().required(),
      clusters: Joi.array().items(clusterSchema).required(),
      contexts: Joi.array().items(contextSchema).required(),
      'current-context': Joi.string().required(),
      kind: Joi.string().required(),
      preferences: Joi.object().required(),
      users: Joi.array().items(userSchema).required()
    });
    
    const schemas = {
      clusterPOST: Joi.object().keys({
        name: Joi.string().pattern(/^\S+$/).message('String with spaces is not allowed').required(),
        description: Joi.string().required(),
        credentials: credentialsSchema,
        cloud: Joi.boolean().required(),
        cni: Joi.string().valid('cilium', 'flannel').required(),
      })
    };

    validation = schemas.clusterPOST.validate(req.body)
    
    
    if(validation.error){
      Logger.error('💊 Middleware validation Cluster error')
      let errorDetails = validation.error.details.map(({ message }) => ({ message }));
      return res.status(400).json({code: 400,message: errorDetails});
    }
    return next();
  } catch (e) {
    Logger.error('🔥 Error: %o', e);
    return next(e);
  }
};

export default validationCluster;
