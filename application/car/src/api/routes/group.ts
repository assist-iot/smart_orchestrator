import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import ResponseFormatter from '../../jobs/responseFormat';
import GroupService from '../../services/groups';

const route = Router();

export default (app: Router) => {
    app.use('/car/group', route);
    const logger:Logger = Container.get('logger');
    const groupServiceInstance = Container.get(GroupService);
    const responseFormat = new ResponseFormatter()
  
    route.get(
      '/',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Car Group ');
        try {
          let response = await groupServiceInstance.getCarGroups()
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
        logger.info('🌌 Calling GET Car Group by id endpoint');
        try {
          let response = await groupServiceInstance.getCarGroupById(req.params.id)
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
        logger.info('🌌 Calling POST Car Group endpoint');
        try{
          let { name, description} = req.body
          let response = await groupServiceInstance.postCarGroup(name,description)
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
          let response = await groupServiceInstance.deleteCarGroup(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )
}
