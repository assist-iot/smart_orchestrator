import { Service, Inject } from 'typedi';
import FiwareService from './auxiliar/fiwareService';
import { AsyncParser } from '@json2csv/node';

@Service()
export default class CarService {
  constructor(
    public fiwareService: FiwareService,
  ) {}

  public async getCarClusterByGroupRef(groupId){
    try{
      let car = await this.fiwareService.getCarClusterByGroupRef(groupId)
      return car
    }catch (error){
      throw error
    }
  }

  public async getCarClusterByGroupRefPagination(pagina: number = 1, groupId) {
    try {
      const limit = 100;
      const clustersData = [];
  
      for (let currentPage = pagina; ; currentPage++) {
        const offset = (currentPage - 1) * limit;
        const response = await this.fiwareService.getCarClusterByGroupRefPagination(groupId, limit, offset);
        
        clustersData.push(...response);
  
        if (response.length < limit) {
          break;
        }
      }
      const clusters = clustersData.map(element => ({
        id: element.id.split(":").pop(),  // Extraer la parte final de la cadena después del último ":" en "id"
        refGroup: element.refGroup.value.split(":").pop()  // Extraer la parte final de la cadena después del último ":" en "refGroup"
      }))
      return clusters;
    } catch (error) {
      throw error;
    }
  }  

  public async convertJsonToCSV(data){
    try{
      const opts = {};
      const transformOpts = {};
      const asyncOpts = {};
      const parser = new AsyncParser(opts, asyncOpts, transformOpts);
  
      const csv = await parser.parse(data).promise();
  
      // The parse method return the transform stream.
      // So data can be passed to a writable stream (a file, http request, etc.)
      // parser.parse(data).pipe(writableStream);
      return csv
    }catch (error){

    }
  }

  public async getCarClusterByGroupRefAndId(groupId, carId){
    try{
      let car = await this.fiwareService.getCarClusterByGroupRefAndId(groupId, carId)
      return car
    }catch (error){
      throw error
    }
  }

  public async getCarClusterById(carId){
    try{
      let car = await this.fiwareService.getCarClusterById(carId)
      return car
    }catch (error){
      throw error
    }
  }

  public async postCarCluster(name,description,group){
    try{
      await this.fiwareService.getCarGroupById(group)
      let timestamp = new Date().getTime().toString();
      let car = await this.fiwareService.postCarCluster(name, description, group, timestamp)
      return car
    }catch (error){
      throw error
    }
  }

  public async deleteCarCluster(carId){
    try{
      let getEnablersInCluster = await this.fiwareService.getCarEnablersByCarRef(carId)
      let enablersInstanciated = getEnablersInCluster.filter(x => x.status.value == "Running" || x.status.value == "Error" || x.status.value == "Pending")
      if(enablersInstanciated.length){
        throw new Error('There are enablers assigned to this Cluster, please delete them')
      }
      let car = await this.fiwareService.deleteCarCluster(carId)
      return car
    }catch (error){
      throw error
    }
  }

}

