import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
import ResponseFormatter from '../../jobs/responseFormat'
import middlewares from '../../middlewares'
import RepoService from '../../services/repos'
import { IRepo } from '../../interfaces/IRepo'


const route = Router()

export default (app: Router) => {
    app.use('/repos', route)
    const logger:Logger = Container.get('logger')
    const repoServiceInstance = Container.get(RepoService)
    const responseFormat = new ResponseFormatter()

    route.get(
      '/',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling GET Repos endpoint')
        try {
          let response = await repoServiceInstance.getRepos()
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/charts/:id',
      middlewares.dbConnectionValidation,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling GET Charts by Repo endpoint')
        try {
          let response = await repoServiceInstance.getChartsByRepo(req.params.id)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/public',
      [
        middlewares.dbConnectionValidation,
        middlewares.validationPublicRepo
      ],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling POST Public Repos endpoint')
        try{
          let response = await repoServiceInstance.postRepo(req.body as IRepo, 'public')
          return res.status(200).json(response)
        }catch (e){
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/private',
      [
        middlewares.dbConnectionValidation,
        middlewares.validationPrivateRepo
      ],
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling POST Private Repos endpoint')
        try{
          let response = await repoServiceInstance.postRepo(req.body as IRepo, 'private')
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
        logger.info('📓 Calling DELETE Repo by ID endpoint')
        try {
          let response = await repoServiceInstance.deleteRepo(req.params.id)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/update',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling POST Update Repo endpoint')
        try {
          let response = await repoServiceInstance.updateIndexRepo()
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

}
