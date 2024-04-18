import { Service, Inject } from 'typedi';
import FiwareService from './auxiliar/fiwareService';
import MqttService from './auxiliar/mqttService';

@Service()
export default class EnablerService {
  constructor(
    public fiwareService: FiwareService,
    public mqttService: MqttService
  ) {}

  public async getCarEnablerByCarId(carId,groupId){
    try{
      let car = await this.fiwareService.getCarClusterById(carId)
      let groupId = car["refGroup"]["value"]
      let enablers = await this.fiwareService.getCarEnablersByCarRef(carId,groupId)
      return enablers
    }catch(error){
      throw error
    }
  }

  public async getGroupEnablersById(groupId){
    try{
      let group = await this.fiwareService.getCarGroupById(groupId)
      let statusArray = ['Running','Error']
      let enablers = []
      for (let enabler of group.enablers.value){
        let groupEnabler = {}
        groupEnabler.id = `urn:ngsi-ld:Enabler:${enabler}`
        for (let status of statusArray){
          let count = await this.fiwareService.getGroupEnablersById(groupId,status,enabler)
          groupEnabler[status] = count
        }
        enablers.push(groupEnabler)
      }
      return enablers
    }catch(error){
      throw error
    }
  }

  public async postEnablerCar(enablerName, helmChart, values, grouId, carId, repository, timestamp, version){
    try{
      let enabler = await this.fiwareService.checkEnablerByIdAndCar(carId, enablerName)
      
      if( !enabler.length ){
        this.mqttService.publishMqttCar(grouId, carId, enablerName, helmChart, values, repository, version)
        await this.fiwareService.postCarEnabler(enablerName,carId,timestamp)
        return {'msg':`Enabler ${enablerName} is being installed`}
      }

      let status = enabler[0].status.value

      if(status !== "Deleting" && status !== "Deleted"){ 
        throw new Error(`Enabler ${enablerName} is already installed, please delete it first`) 
      }
      
      if(status == "Deleting" || status == "Deleted"){
        this.mqttService.publishMqttCar(grouId, carId, enablerName, helmChart, values, repository, version)
        await this.fiwareService.updateCarEnabler(enablerName,carId)
        return {'msg':`Enabler ${enablerName} is being installed`}
      }

    }catch(error){
      throw error
    }
  }

  public async postEnablerGroup(enablerName, helmChart, values, groupId, repository, version){
    try{
      let getGroupResponse = await this.fiwareService.getCarGroupById(groupId)
      if(getGroupResponse.enablers.value.includes(enablerName)){
        throw new Error(`Enabler ${enablerName} is already installed, please delete it first`) 
      }else{
        getGroupResponse.enablers.value.push(enablerName)
        await this.fiwareService.updateCarGroup(getGroupResponse)
        this.mqttService.publishMqttGroup(groupId, enablerName, helmChart, values, repository, version)
        return {'msg':`Enabler ${enablerName} is being installed`}
      }
    }catch(error){
      throw error
    }
  }

  public async deleteEnablerCar(enablerName, groupId, carId){
    try{
      let enabler = await this.fiwareService.checkEnablerByIdAndCar(carId, enablerName)
      
      if( !enabler.length ){
        throw new Error(`Enabler ${enablerName} is not installed, can not be deleted`)
      }

      await this.fiwareService.deleteCarEnabler(enablerName, carId)
      this.mqttService.deleteMqttCar(groupId, carId, enablerName)

      return {'msg':`Enabler ${enablerName} is being deleted in car ${carId}`}

    }catch(error){
      throw error
    }
  }

  public async deleteEnablerGroup(enablerName, groupId){
    try{
      let getGroupResponse = await this.fiwareService.getCarGroupById(groupId)
      if(!getGroupResponse.enablers.value.includes(enablerName)){
        throw new Error(`Enabler ${enablerName} is not installed in this group`) 
      }else{
        getGroupResponse.enablers.value = getGroupResponse.enablers.value.filter(e => e !== enablerName)
        await this.fiwareService.updateCarGroup(getGroupResponse)
        this.mqttService.deleteMqttGroup(groupId, enablerName)
        return {'msg':`Enabler ${enablerName} is being deleted in group ${groupId}`}
      }
    }catch(error){
      throw error
    }
  }
}

