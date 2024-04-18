import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const helmMicroservice = config.helm

@Service()
export default class HelmService {
  constructor(
  ) {}
    /**
   * Creates an enabler in the helm microservice.
   * 
   * @param dataPost JSON object representing the enabler.
   * @returns Response from the helm microservice.
  */
   public async PostEnabler(bodyPost, credentials, values){
      try {
         let headers = {
            "Release-Name": bodyPost.name,
            "Chart": bodyPost.helmChart,
            "Timeout": bodyPost.timeout,
            "Version": bodyPost.version
         }
         const {data}  = await axios.post<JSON>( `${helmMicroservice}/enabler/install`, {credentials, values}, {headers});
         return data
      } catch (error) {
         throw error
      }
   }
       /**
   * Creates an enabler in the helm microservice.
   * 
   * @param dataPost JSON object representing the enabler.
   * @returns Response from the helm microservice.
  */
   public async UpgradeEnabler(name, helmChart, bodyPost, credentials, values){
      try {
         let headers = {
            "Release-Name": name,
            "Chart": helmChart,
            "Timeout": bodyPost.timeout,
            "Version": bodyPost.version
         }
         const data  = await axios.post<JSON>( `${helmMicroservice}/enabler/upgrade`, {credentials, values}, {headers});
         return data
      } catch (error) {
         throw error
      }
   }
    /**
   * Deletes an enabler in the helm microservice.
   * 
   * @param dataPost JSON object representing the enabler.
   * @returns Response from the helm microservice.
  */
   public async DeleteEnabler(id, bodyPost, credentials){
      try {
         let headers = {
            "Timeout": bodyPost.timeout,
         }
         const data  = await axios.delete<JSON>( `${helmMicroservice}/enabler/uninstall/${id}`, { data: {credentials}, headers});
         return data
      } catch (error) {
         throw error
      }
   }
}