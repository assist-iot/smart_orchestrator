import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const repoMicroservice = config.repository

@Service()
export default class ClusterService {
  constructor(
  ) {}

   public async getRepositories(){
    try {
       let repo = await axios.get<JSON>( `${repoMicroservice}/repos/`);
       return repo
    } catch (error) {
       throw error
    }
   }

   public async getChartsByRepo(uid){
      try {
         let repo = await axios.get<JSON>( `${repoMicroservice}/repos/charts/${uid}`);
         return repo
      } catch (error) {
         throw error
      }
     }
}