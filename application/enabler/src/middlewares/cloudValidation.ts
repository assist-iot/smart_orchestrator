import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../config';
import { Logger } from 'winston';

const cloudMicroservice = config.cluster

const CloudValidation = async (req, res, next) => {
   const Logger : Logger = Container.get('logger');

   try {
      await axios.get<JSON>( `${cloudMicroservice}/clusters/cloud/find`);
      return next()
   } catch (error) {
      Logger.error('💊 Middleware validation Cluster error');
      return res.status(400).json({code: 400,message: 'Cloud cluster does not exist. please add a cluster'})

   }
}

 export default CloudValidation;
 