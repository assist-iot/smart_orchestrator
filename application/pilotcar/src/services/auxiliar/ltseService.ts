import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config';

const ltseMicroservice = config.LTSEURI

@Service()
export default class LtseService {
  constructor(
  ) {}
    /**
   *Makes a query to the LTSE.
   * 
   * @param query JSON object representing the query.
   * @param type String representing type of LTSE GET/POST (_search, etc.)
   * @param index String representing the LTSE NoSQL index
   * @returns Response from the LTSE microservice.
  */

   public async getIndexQuery(index, query){
      let config = {
         method: 'get',
         maxBodyLength: Infinity,
         url: `${ltseMicroservice}/${index}/_search`,
         headers: { 
            'Content-Type': 'application/json'
         },
         data:query
      };
          
      try{
         let response = await axios.request(config)
         //let list = response.data.aggregations.unique.buckets.map(bucket => bucket.key);
         return response.data.aggregations.emissions.buckets;
      } catch(error) {
         throw error
      }
   }
   

   public async getElasticData(index, type, id){
      try {
         const data  = await axios.get<JSON>( `${ltseMicroservice}/${index}/${type}/${id}`);
         return data.data
      } catch (error) {
         throw error
      }
   }

   public async getList(index, type, subfleet, resource){
      let query = subfleet == 'all' ?
         JSON.stringify({
            "size": 0,
            "aggs": {
               "unique": {
                  "terms": {
                     "field": resource,
                     "size": 100
                  }
               }
            }
         })
         :  JSON.stringify({
            "size": 0,
            "query": {
               "bool": {
                  "must": [
                  {
                     "term": {
                        "subfleet": subfleet
                     }
                  }
                  ]
               }
            },
            "aggs": {
               "unique": {
                  "terms": {
                     "field": resource,
                     "size": 100
                  }
               }
            }
         });
          
      let config = {
         method: 'get',
         maxBodyLength: Infinity,
         url: `${ltseMicroservice}/${index}/${type}`,
         headers: { 
            'Content-Type': 'application/json'
         },
         data:query
      };
          
      try{
         let response = await axios.request(config)
         let list = response.data.aggregations.unique.buckets.map(bucket => bucket.key);
         return list;
      } catch(error) {
         throw error
      }
   }

   public async carsList(index, query){
      let config = {
         method: 'get',
         maxBodyLength: Infinity,
         url: `${ltseMicroservice}/${index}/_search`,
         headers: { 
            'Content-Type': 'application/json'
         },
         data:query
      };
          
      try{
         let response = await axios.request(config)
         return response
      } catch(error) {
         throw error
      }
   }

}