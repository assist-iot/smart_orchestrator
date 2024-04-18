import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import ResponseFormatter from '../../jobs/responseFormat';
import middlewares from '../../middlewares';
import ClusterService from '../../services/clusters';
import { ICluster } from '../../interfaces/ICluster';


const route = Router();

export default (app: Router) => {
    app.use('/clusters', route);
    const logger:Logger = Container.get('logger');
    const clusterServiceInstance = Container.get(ClusterService);
    const responseFormat = new ResponseFormatter()

    route.get(
      '/',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Clusters endpoint');
        try {
          let response = await clusterServiceInstance.getClusters()
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.get(
      '/:id',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Clusters by id endpoint');
        try {
          let response = await clusterServiceInstance.getClustersById(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.get(
      '/cloud/find',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Cloud endpoint');
        try {
          let response = await clusterServiceInstance.getCloudCluster()
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.post(
      '/',
      [
        middlewares.dbConnectionValidation,
        middlewares.validationCluster
      ],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling POST Clusters endpoint');
        try{
          let response = await clusterServiceInstance.postClusters(req.body as ICluster)
          return res.status(200).json(response);
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    );

    route.delete(
      '/:id',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling DELETE Clusters endpoint');
        try {
          let response = await clusterServiceInstance.deleteCluster(req.params.id, req.headers)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/node/:id',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('🌌 Calling GET Nodes by cluster endpoint');
        try {
          let response = await clusterServiceInstance.getNodeByCluster(req.params.id)
          return res.status(200).json(response);
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

}
