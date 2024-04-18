import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
import ResponseFormatter from '../../jobs/responseFormat'
import middlewares from '../../middlewares'
import EnablerService from '../../services/enabler'

import { IEnabler } from '../../interfaces/IEnabler'


const route = Router()

export default (app: Router) => {
  app.use('/enabler', route)
  const logger:Logger = Container.get('logger')
  const enableServiceInstance = Container.get(EnablerService)
  const responseFormat = new ResponseFormatter()

  route.get(
    '/',
    [
      middlewares.dbConnectionValidation,
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('📓 Calling GET Enabler endpoint')
      try{
        let response = await enableServiceInstance.getEnabler()
        return res.status(200).json(response)
      }catch (e){
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.get(
    '/cluster/:clusterId',
    [
      middlewares.dbConnectionValidation,
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('📓 Calling GET Enabler by cluster endpoint')
      try{
        let response = await enableServiceInstance.getEnablerByCluster(req.params.clusterId)
        return res.status(200).json(response)
      }catch (e){
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.post(
    '/',
    [
      middlewares.dbConnectionValidation,
      middlewares.Scheduler,
      middlewares.CloudValidation,
      middlewares.ClusterEnabledValidation
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('📓 Calling POST Enabler endpoint')
      try{
        let response = await enableServiceInstance.postEnabler(req.body as IEnabler)
        return res.status(200).json(response)
      }catch (e){
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.post(
    '/upgrade/:id',
    [
      middlewares.dbConnectionValidation
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('📓 Calling UPGRADE Enabler endpoint')
      try{
        let response = await enableServiceInstance.upgradeEnabler(req.params.id,req.body)
        return res.status(200).json(response)
      }catch (e){
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.delete(
    '/:id',
    middlewares.dbConnectionValidation,
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('🌌 Calling DELETE Enablers endpoint');
      try {
        let response = await enableServiceInstance.deleteEnabler(req.params.id, req.headers)
        return res.status(200).json(response);
      } catch (e) {
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.delete(
    '/cluster/:clusterId',
    middlewares.dbConnectionValidation,
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('🌌 Calling DELETE Enablers by cluster endpoint');
      try {
        let response = await enableServiceInstance.deleteEnablerByCluster(req.params.clusterId)
        return res.status(200).json(response);
      } catch (e) {
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )

  route.delete(
    '/volumes/:id',
    middlewares.dbConnectionValidation,
    async (req: Request, res: Response, next: NextFunction) => {
      logger.info('🌌 Calling DELETE Volumes endpoint');
      try {
        let response = await enableServiceInstance.deletePVC(req.params.id)
        return res.status(200).json(response);
      } catch (e) {
        let error = await responseFormat.handler(e)
        res.status(error.code).json(error)
      }
    }
  )
}

