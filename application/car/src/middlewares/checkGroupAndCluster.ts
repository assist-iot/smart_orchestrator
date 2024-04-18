import { Container } from 'typedi';
import { Logger } from 'winston';
import FiwareService from '../services/auxiliar/fiwareService';
import ResponseFormatter from '../jobs/responseFormat';

let fiwareServiceInstance = Container.get(FiwareService)
let responseFormat = new ResponseFormatter()

const checkGroupAndCluster = async (req, res, next) => {
  const Logger : Logger = Container.get('logger');
  try {
    Logger.info('💊 Middleware Check Repository and Helm Chart exist fired')
    let {groupId, carId} = req.params

    await fiwareServiceInstance.getCarGroupById(groupId)
    await fiwareServiceInstance.getCarClusterById(carId)
    let getClusterrRefResponse = await fiwareServiceInstance.getCarClusterByGroupRefAndId(groupId,carId)
    if (!getClusterrRefResponse.length){
      let error = new Error(`The car with uid ${carId} does not belong to the group ${groupId}`)
      error.name = 'Fiware'
      throw error
    }
    return next();
  } catch (e) {
    Logger.error('🔥 Error with Check Group and Car exist');
    if(e.name == 'Fiware'){
      res.status(400).json({code: 400,message: e.message})
    }else{
      let error = await responseFormat.handler(e)
      res.status(error.code).json(error)
    }
  }
};

export default checkGroupAndCluster;
