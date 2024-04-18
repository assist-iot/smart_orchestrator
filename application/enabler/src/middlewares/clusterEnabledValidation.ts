import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../config';
import { Logger } from 'winston';

const cloudMicroservice = config.cluster

const ClusterEnabledValidation = async (req, res, next) => {
   const Logger : Logger = Container.get('logger');

   try {
      let {cluster} = req.body
      let clusterDb = await axios.get<JSON>( `${cloudMicroservice}/clusters/${cluster}`);
      if (clusterDb.data.status == 'Enabled'){
         return next()
      }else{
         throw Error
      }
   } catch (error) {
      Logger.error('💊 Middleware validation Cluster Enabled error');
      return res.status(400).json({code: 400,message: 'Cluster is not enabled or does not exist'})

   }
}

 export default ClusterEnabledValidation;
 