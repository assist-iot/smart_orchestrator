import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const helmMicroservice = config.helm

@Service()
export default class HelmService {
  constructor(
  ) {}
    /**
   * Creates a repository in the helm microservice.
   * 
   * @param dataPost JSON object representing the repository.
   * @param type Type of the repository (public or private)
   * @returns Response from the helm microservice.
  */
   public async PostRepository(dataPost, type){
      try {
         const data  = await axios.post<JSON>( `${helmMicroservice}/repos/${type}/`, dataPost);
         return data
      } catch (error) {
         throw error
      }
   }
  /**
   * Deletes a repository in the helm microservice.
   * 
   * @param repo JSON object representing the repository.
   * @returns Response from the helm microservice.
  */
   public async DeleteRepository(repo){
      try {
         const data  = await axios.delete<JSON>( `${helmMicroservice}/repos/${repo}/`);
         return data
      } catch (error) {
         throw error
      }
   }
  /**
   * Updates index files of each repository.
   * 
   * @returns Response from the helm microservice.
  */
   public async UpdateIndexRepository(){
      try {
         const {data}  = await axios.post<JSON>( `${helmMicroservice}/repos/update/`);
         return data
      } catch (error) {
         throw error
      }
   }
     /**
   * Updates index files of each repository.
   * 
   * @returns Response from the helm microservice.
  */
     public async getChartsByRepository(repoName){
      try {
         const {data}  = await axios.get<JSON>( `${helmMicroservice}/enabler/repo/${repoName}`);
         return data
      } catch (error) {
         throw error
      }
   }
}