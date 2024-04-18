import { Container } from 'typedi';
import { Logger } from 'winston';
// import config from '../config'
import mongoose from 'mongoose';
import mongooseLoader from '../loaders/mongoose';

const dbConnectionValidation = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    
    let connection = mongoose.connection.readyState
    switch(connection){
        case 0:
            Logger.error('💊 Middleware DB connection error: Disconnected')
            await mongooseLoader();
            break;
        case 1:
            break;
        case 2:
            Logger.info('💊 Middleware DB connection info: connecting')
            break;
        case 3:
            Logger.info('💊 Middleware DB connection info: disconnecting')
            break;
    }
    
    return next();

  } catch (e) {
    if (!e.response) {
        Logger.error('💊 Middleware DB connection error');
        return res.status(500).send({status:500,code:'ECONNREFUSED',detail:`No connection with DB`})
    }
    return next(e);
  }
};

export default dbConnectionValidation;
