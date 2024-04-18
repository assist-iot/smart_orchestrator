import { Container } from 'typedi';
import { Logger } from 'winston';
import { Error } from 'mongoose';

export default class ResponseFormatter {
  public async handler(response): Promise<JSON> {
    const Logger: Logger = Container.get('logger');
    try {
      if (response instanceof Error.ValidationError) {
        let errors = Object.values(response.errors).map((err) => err.message);
        let message = errors.length === 1 ? errors[0] : errors
        return {
          code: 400,
          message: message
        }
      }
      if(response.name == 'MongoServerError' && response.code === 11000){
        return {
          code: 400,
          message: ` A cluster with value ${Object.values(response.keyValue)[0]} already exists ` 
        }
      }
      if(response.name == 'HttpError'){
        return {
          code: response.statusCode,
          message: `Http error for the reason: ${response.body.message }`
        }
      }
      if(response.name == 'Error'){
        return {
          code: 400,
          message: `${response.message }`
        }    
      }
      if(response.name == 'Cilium'){
        return {
          code: 400,
          message: `${response.message }`
        }    
      }
    } catch (e) {
      Logger.error('🔥 Error with Response formatter Job: %o', e);
      return {e};
    }
  }
}
