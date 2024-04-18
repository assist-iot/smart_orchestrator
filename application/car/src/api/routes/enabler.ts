import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import ResponseFormatter from '../../jobs/responseFormat';
import EnablerService from '../../services/enabler';
import middlewares from '../../middlewares';

const route = Router();

export default (app: Router) => {
    app.use('/car/enabler', route);
    const logger:Logger = Container.get('logger');
    const enablerServiceInstance = Container.get(EnablerService);
    const responseFormat = new ResponseFormatter()

    route.get(
      '/:carId',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Enabler by Car endpoint');
        try{
          let {carId} = req.params
          let response = await enablerServiceInstance.getCarEnablerByCarId(carId)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/group/:groupId',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Enabler by Group endpoint');
        try {
          let {groupId} = req.params
          let response = await enablerServiceInstance.getGroupEnablersById(groupId)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/:groupId/:carId',
      [middlewares.checkRepoAndHelmChart,
       middlewares.checkGroupAndCluster],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling POST Enabler Car endpoint');
        try{
          let {enablerName, helmChart, values, repository, version} = req.body
          let {groupId, carId} = req.params
          let timestamp = new Date().getTime().toString()
          let response = await enablerServiceInstance.postEnablerCar(enablerName, helmChart, values, groupId, carId, repository, timestamp, version)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/:groupId',
      middlewares.checkRepoAndHelmChart,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling POST Enabler Group endpoint');
        try {
          let {enablerName, helmChart, values, repository, version} = req.body
          let {groupId} = req.params
          let response = await enablerServiceInstance.postEnablerGroup(enablerName, helmChart, values, groupId, repository, version)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.delete(
      '/car/:groupId/:carId/:enablerName',
      [middlewares.checkGroupAndCluster],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling DELETE Enabler Car endpoint');
        try{
          let {groupId, carId, enablerName} = req.params
          let response = await enablerServiceInstance.deleteEnablerCar(enablerName, groupId, carId)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.delete(
      '/group/:groupId/:enablerName',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling DELETE Enabler Group endpoint');
        try{
          let {groupId,enablerName} = req.params
          let response = await enablerServiceInstance.deleteEnablerGroup(enablerName, groupId)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )
}
