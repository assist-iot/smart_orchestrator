import { Container } from 'typedi';
import { Logger } from 'winston';

export default class ResponseFormatter {
  public async handler(response): Promise<JSON> {
    const Logger: Logger = Container.get('logger');
    try {
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
      if(response.name == 'AxiosError'){
        return {
          code: 400,
          message: `${response.response.data.error }`
        }    
      }
    } catch (e) {
      Logger.error('🔥 Error with Response formatter Job: %o', e);
      return {e};
    }
  }
}
