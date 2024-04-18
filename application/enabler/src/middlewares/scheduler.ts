import { Container, Service, Inject } from 'typedi'
import { Logger } from 'winston';
import SchedulerService from '../services/auxiliar/schedulerService'
import ClusterService from '../services/auxiliar/clusterService'

const Scheduler = async (req, res, next) => {
   const Logger : Logger = Container.get('logger');
   const schedulerServiceInstance = Container.get(SchedulerService)
   const clusterServiceInstance = Container.get(ClusterService)

   try {
      if (req.body.auto == true){
         let {helmChart, placement_policy, values} = req.body
         let cluster = await schedulerServiceInstance.getClusterScheduler(helmChart, placement_policy, values)
         let clusters = await clusterServiceInstance.getAllClusters()

         let uid = clusters.filter((k8scluster) => k8scluster.name == cluster[0].name)[0]['uid']
         req.body.cluster = uid
         return next()
      }else{
         return next()
       }
   } catch (error) {
      console.log(error)

      Logger.error('💊 Middleware Scheduler error');
      if (error.name == 'SchedulerReplicas'){
         return res.status(400).json({code: 400,message: error.message})
      }else{
         return res.status(400).json({code: 400,message: error.response.data.msg})
      }
   }
}

 export default Scheduler;
 