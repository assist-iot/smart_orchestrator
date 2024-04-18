import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const cloudMicroservice = config.cluster

@Service()
export default class ClusterService {
  constructor(
  ) {}

   public async getCredentials(uid){
    try {
       let cluster = await axios.get<JSON>( `${cloudMicroservice}/clusters/${uid}`);
       return cluster.data.credentials
    } catch (error) {
       throw error
    }
   }

   public async getAllClusters(){
      try {
         let cluster = await axios.get<JSON>( `${cloudMicroservice}/clusters`);
         return cluster.data
      } catch (error) {
         throw error
      }
     }
}