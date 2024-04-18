import { Container, Service, Inject } from 'typedi'
import axios from 'axios'
import config from '../../config'

const fiwareMicroservice = config.fiware

@Service()
export default class FiwareService {
  constructor(
  ) {}
  
  /*
  ###################################################
  ##################### GROUP #######################
  ###################################################
  */

   public async getCarGroups(){
      try {
         let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities?type=Group`)
         return data
      } catch (error) {
         throw new Error('No group found')
      }
   }

   public async getCarGroupById(group){
      try {
         let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/urn:ngsi-ld:Group:${group}`)
         return data
      } catch (error) {
         throw new Error('No group found')
      }
   }

   public async postCarGroup(name,description,timestamp){
    try {
      let headers = {
         'Content-Type': 'application/json',
         Accept: 'application/json'
      }
       let body = {
         "id":`urn:ngsi-ld:Group:${name}`, "type":"Group",
         "description":{"type":"Text", "value": description},
         "enablers":{"type":"Text", "value":[]},
         "timestamp":{"type":"Text", "value": timestamp}
       }

       await axios.post<JSON>( `${fiwareMicroservice}/entities/`, body, {headers})
       return {"id":name}
    } catch (error) {
       throw error
    }
   }

   public async updateCarGroup(dataGroup){
      try {
         delete dataGroup.enablers.metadata
         delete dataGroup.enablers.type
         let headers= {
            'Content-Type': 'application/json',
             Accept: 'application/json'
         }
         let body = {"enablers": dataGroup.enablers}
         let {data}  = await axios.post<JSON>(`${fiwareMicroservice}/entities/${dataGroup.id}/attrs`, body, {headers})
         return data
      } catch (error) {
        throw error
      }
   }

   public async deleteCarGroup(id){
      try {
        await axios.delete<JSON>(`${fiwareMicroservice}/entities/urn:ngsi-ld:Group:${id}`)
        return {id}
      } catch (error) {
        throw error
      }
   }
  
   /*
   ###################################################
   ################### CAR ###########################
   ###################################################
   */

   public async getCarClusterByGroupRef(group){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?type=Cluster&q=refGroup==urn:ngsi-ld:Group:${group}`)
        return data
      } catch (error) {
        throw error
      }
   }
   
   public async getCarClusterByGroupRefPagination(group,limit,offset){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?type=Cluster&q=refGroup==urn:ngsi-ld:Group:${group}&limit=${limit}&offset=${offset}&attrs=refGroup`)
        return data
      } catch (error) {
        throw error
      }
   }
  

   public async getNumberCarClusterByGroupRef(groupId){
      try {
        let {headers}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?type=Cluster&q=refGroup==${groupId}&options=count`)
        return headers['fiware-total-count']
      } catch (error) {
        throw error
      }
   }

   public async getCarClusterByGroupRefAndId(group,carId){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?q=refGroup==urn:ngsi-ld:Group:${group}&id=urn:ngsi-ld:Cluster:${carId}`)
        return data
      } catch (error) {
         throw error
      }
   }
  
   public async getCarClusterById(carId){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/urn:ngsi-ld:Cluster:${carId}`)
        return data;
      } catch (error) {
         throw new Error('No car found')
      }
   }
  
   public async postCarCluster(name, description, group, timestamp){
      try {
         let headers= {
            'Content-Type': 'application/json',
            Accept: 'application/json',
         }
         let body ={
            "id":`urn:ngsi-ld:Cluster:${name}`, "type":"Cluster",
            "description":{"type":"Text", "value":description},
            "refGroup":{"type":"Relationship", "value":`urn:ngsi-ld:Group:${group}`},
            "timestamp":{"type":"Text", "value": timestamp}
         }
         let {data}  = await axios.post<JSON>(`${fiwareMicroservice}/entities/`,body, {headers})
        return {'id': name}
      } catch (error) {
        throw error
      }
   }
  
   public async deleteCarCluster(id){
      try {
         await axios.delete<JSON>(`${fiwareMicroservice}/entities/urn:ngsi-ld:Cluster:${id}`)
         return {id}
      } catch (error) {
         throw error
      }
   }  
   
   /*
   ###################################################
   ################### ENABLER #######################
   ###################################################
   */

   public async checkEnablerByIdAndCar(carId,enablerName){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?q=refCluster==urn:ngsi-ld:Cluster:${carId}&id=urn:ngsi-ld:Enabler:${enablerName}:Cluster:${carId}`);
        return data
      } catch (error) {
         throw error
      }
   }

   public async postCarEnabler(name,cluster,timestamp){
      try {
         let body = {
            "id":`urn:ngsi-ld:Enabler:${name}:Cluster:${cluster}`, "type":"Enabler",
            "refCluster":{"type":"Relationship", "value":`urn:ngsi-ld:Cluster:${cluster}`},
            "refGroup":{"type":"Relationship", "value":""},
            "status":{"type":"Text", "value": "Pending"},
            "info":{"type":"Text", "value": "Pending"},
            "timestamp":{"type":"Text", "value": timestamp}
         }
         let headers = {
           'Content-Type': 'application/json',
           Accept: 'application/json',
         }
         let {data}  = await axios.post<JSON>(`${fiwareMicroservice}/entities/`, body, {headers})
        return data
      } catch (error) {
         throw error
      }
   }

   public async updateCarEnabler(enablerName,carId){
      try {
         let body = {"status":{"value": "Pending"},
         "info":{"value": "Pending"},
         }
         let headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
         }
         let {data}  = await axios.post<JSON>( `${fiwareMicroservice}/entities/urn:ngsi-ld:Enabler:${enablerName}:Cluster:${carId}/attrs`, body, headers )
         return data

      } catch (error) {
         throw error
      }
    }

   public async deleteCarEnabler(enablerName,carId){
   try {
      let body = {
         "status":{"value": "Deleting"},
         "info":{"value": "Deleting"},
      }
      let headers = {
         headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
         }
      }
      await axios.post<JSON>(`${fiwareMicroservice}/entities/urn:ngsi-ld:Enabler:${enablerName}:Cluster:${carId}/attrs`, body, {headers});
      return {'Enabler Name': enablerName}

   } catch (error) {
      throw error
   }
   }

   public async getCarEnablersByCarRef(carId,groupId){
      try {
        let {data}  = await axios.get<JSON>(`${fiwareMicroservice}/entities/?q=refCluster==urn:ngsi-ld:Cluster:${carId};refGroup!=${groupId}`)
        return data
      } catch (error) {
         throw error
      }
    }
   
   public async getGroupEnablersById(groupId,status,enabler){
      try {
        let {headers}  = await axios.get<JSON>(`${fiwareMicroservice}/entities?q=refGroup==urn:ngsi-ld:Group:${groupId}&type=Enabler&options=count&q=status==${status}&idPattern=${enabler}`)
        return headers['fiware-total-count']
      } catch (error) {
         throw error
      }
    }

}