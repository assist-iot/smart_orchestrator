import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const schedulerMicroservice = config.scheduler

@Service()
export default class SchedulerService {
  constructor(
  ) {}

   public async getClusterScheduler(helmChart, placement_policy, values){
    try {
       let cluster = await axios.post<JSON>( `${schedulerMicroservice}/scheduler`,  {helmChart,placement_policy,values});
       var lenCluster = Object.keys(cluster.data).length;
       if (lenCluster == 0){
         let e = new Error('Too many replicas to be instantiated in a cluster')
         e.name = 'SchedulerReplicas';
         throw e
      }
       return cluster.data
    } catch (error) {
      throw error
    }
 }
}