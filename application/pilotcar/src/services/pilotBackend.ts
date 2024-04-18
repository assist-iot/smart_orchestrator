import { Service, Inject } from 'typedi';
import LtseService from './auxiliar/ltseService';
import SemRepoService from './auxiliar/semRepoService';
import MqttService from './auxiliar/mqttService';
import { AsyncParser } from '@json2csv/node';
import config from '../config';


@Service()
export default class PilotBackendService {
  constructor(
    public ltseService: LtseService,
    public semRepoService: SemRepoService,
    public mqttService: MqttService
  ) {}

  public async getIndexQuery(index, query){
    try{
      let response = await this.ltseService.getIndexQuery(index, query)
      return response
    }catch (error){
      throw error
    }
  }


  public async getElasticData(index,id){
    try{
      let response = await this.ltseService.getElasticData(index, "_source", id)
      return response
    }catch (error){
      throw error
    }
  }

  public async getModel(namespace,model){
    try{
      let response = await this.semRepoService.getModel(namespace)
      return response.models.items
    }catch (error){
      throw error
    }
  }

  public async getNamespace(){
    try{
      let response = await this.semRepoService.getNamespace()
      return response.namespaces.items
    }catch (error){
      throw error
    }
  }
  
  public async carsList(index, query){
    try{
      let response = await this.ltseService.carsList(index, query)
      let cars = await this.convertJsonToCSV(response.data.aggregations.cars.buckets)
      return cars
    }catch (error){
      throw error
    }
  }

  public async getList(index, subfleet, resource){
    try{
      let response = await this.ltseService.getList(index, "_search", subfleet, resource)
      return response
    }catch (error){
      throw error
    }
  }

  public async postCalibration(calibrationFile, model, version){
    try{
      let response = await this.semRepoService.postCalibration(calibrationFile, model, version)
      return response
    }catch (error){
      throw error
    }
  }

  public async getVersions(model){
    try{
      let response = await this.semRepoService.getVersions(model)
      return response
    }catch (error){
      throw error
    }
  }

  public async postVersion(model, version){
    try{
      let response = await this.semRepoService.postVersion(model, version)
      return response
    }catch (error){
      throw error
    }
  }

  public async postModel(namespace,model){
    try{
      let response = await this.semRepoService.postModel(namespace,model)
      return response
    }catch (error){
      throw error
    }
  }

  public async postNamespace(namespace){
    try{
      let response = await this.semRepoService.postNamespace(namespace)
      return response
    }catch (error){
      throw error
    }
  }

  public async calibrateSubfleet(groupId, model,version){
    try{

      let semRepoUrl = `${config.semRepoExternal}/firmware/${model}/${version}/content?format=cal`
      let response = await this.mqttService.calibrateSubfleet(groupId, semRepoUrl)
      return response
    }catch (error){
      throw error
    }
  }

  private async convertJsonToCSV(data){
    try{
      const opts = {};
      const transformOpts = {};
      const asyncOpts = {};
      const parser = new AsyncParser(opts, asyncOpts, transformOpts);
      const csv = await parser.parse(data).promise();
      return csv
    }catch (error){
      throw error
    }
  }
}

