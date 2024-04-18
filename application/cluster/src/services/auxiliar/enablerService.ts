import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const enablerMicroservice = config.enabler

@Service()
export default class EnablerService {
  constructor(
  ) {}

   public async getEnablersByCluster(uid){
    try {
       let {data} = await axios.get<JSON>( `${enablerMicroservice}/enabler/cluster/${uid}`);
       return data
    } catch (error) {
       throw error
    }
   }

   public async deleteEnablersInCluster(cluster){
      try {
         let {data} = await axios.delete<JSON>( `${enablerMicroservice}/enabler/cluster/${cluster}`);
         return data
      } catch (error) {
         throw error
      }
     }
}