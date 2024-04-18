import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import ResponseFormatter from '../../jobs/responseFormat';
import CarService from '../../services/car';

const route = Router();

export default (app: Router) => {
    app.use('/car/cluster', route);
    const logger:Logger = Container.get('logger');
    const carServiceInstance = Container.get(CarService);
    const responseFormat = new ResponseFormatter()

    route.get(
      '/group/:id',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Car by Group Id endpoint');
        try {
          let response = await carServiceInstance.getCarClusterByGroupRef(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.get(
      '/group/csv/:id',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Car by Group Id endpoint in a CSV');
        try {
          let cars = await carServiceInstance.getCarClusterByGroupRefPagination(1,req.params.id)
          let csv = await carServiceInstance.convertJsonToCSV(cars)
          res.attachment('vehicles.csv').send(csv)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.get(
      '/:groupId/:carId',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Car by Group id and Car id endpoint');
        try {
          let {groupId, carId} = req.params
          let response = await carServiceInstance.getCarClusterByGroupRefAndId(groupId, carId)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.get(
      '/:id',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Car by id endpoint');
        try {
          let response = await carServiceInstance.getCarClusterById(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.post(
      '/',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling POST Car endpoint');
        try{
          let { name, description, group} = req.body
          let response = await carServiceInstance.postCarCluster(name, description, group)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.delete(
      '/:id',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling DELETE Clusters endpoint');
        try {
          let response = await carServiceInstance.deleteCarCluster(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )
}
