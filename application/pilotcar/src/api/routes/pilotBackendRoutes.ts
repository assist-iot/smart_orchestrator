import { Router, Request, Response, NextFunction } from 'express'
import { Container } from 'typedi'
import { Logger } from 'winston'
import multer from 'multer'
import ResponseFormatter from '../../jobs/responseFormat'
import PilotBackend from '../../services/pilotBackend'

const fs = require('fs')
const route = Router()

var storage = multer.diskStorage({
  destination: function (req,file,cb){
      cb(null, './uploads')
  },
  filename: function (req,file,cb){
      cb(null,file.originalname);
  },
});
const upload = multer({storage: storage});



export default (app: Router) => {

    app.use('/data', route)
    const logger:Logger = Container.get('logger')
    const PilotBackendInstance = Container.get(PilotBackend)
    const responseFormat = new ResponseFormatter()

    route.get(
      '/indexQuery',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Getting query data')
        try {
          let response = await PilotBackendInstance.getIndexQuery(req.query.index, req.query.query)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )
    
    route.get(
      '/',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling LSTE endpoint')
        try {
          let response = await PilotBackendInstance.getElasticData(req.query.index, req.query.id)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/carsList',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Getting query data')
        try {
          let response = await PilotBackendInstance.carsList(req.query.index, req.query.query)
          res.attachment('vehicles.csv').send(response)

        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/list',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling LSTE endpoint - list')
        try {
          let response = await PilotBackendInstance.getList(req.query.index, req.query.subfleet, req.query.resource)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/model',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - get model in a namespace endpoint')
        try {
          let response = await PilotBackendInstance.getModel(req.query.namespace)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/namespace/',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - get namespace endpoint')
        try {
          let response = await PilotBackendInstance.getNamespace()
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/calibration',
      upload.single('calibrationFile'),
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - post calibration file')
        try {
          let response = await PilotBackendInstance.postCalibration(req.file, req.body.model, req.body.version)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.get(
      '/versions',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - get versions endpoint')
        try {
          let response = await PilotBackendInstance.getVersions(req.query.model)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/version',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - post version endpoint')
        try {
          let response = await PilotBackendInstance.postVersion(req.body.params.model, req.body.params.version)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/model',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - post model in a namespace endpoint')
        try {
          let response = await PilotBackendInstance.postModel(req.query.namespace,req.query.model)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/namespace/:namespace',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - post namespace endpoint')
        try {
          let response = await PilotBackendInstance.postNamespace(req.params.namespace)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )

    route.post(
      '/calibration/subfleet/:subfleet',
      async (req: Request, res: Response, next: NextFunction) => {
        logger.info('📓 Calling SemRepo endpoint - post namespace endpoint')
        try {
          let response = await PilotBackendInstance.calibrateSubfleet(req.params.subfleet,req.query.model,req.query.version)
          return res.status(200).json(response)
        } catch (e) {
          let error = await responseFormat.handler(e)
          res.status(error.code).json(error)
        }
      }
    )
}

