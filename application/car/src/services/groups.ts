import { Service, Inject } from 'typedi';
import FiwareService from './auxiliar/fiwareService';

@Service()
export default class GroupService {
  constructor(
    public fiwareService: FiwareService
  ) {}

  public async getCarGroups(){
    try{
      let groups = await this.fiwareService.getCarGroups()
      for (let group of groups){
        let {id} = group
        let numberCarsInGroup = await this.fiwareService.getNumberCarClusterByGroupRef(id)
        group.countCars = numberCarsInGroup
      }
      return groups
    }catch (error){
      throw error
    }
  }

  public async getCarGroupById(groupId){
    try{
      let group = await this.fiwareService.getCarGroupById(groupId)
      return group
    }catch (error){
      throw error
    }
  }

  public async postCarGroup(name,description){
    try{
      let timestamp = new Date().getTime().toString();
      let group = await this.fiwareService.postCarGroup(name,description,timestamp)
      return group
    }catch (error){
      throw error
    }
  }

  public async deleteCarGroup(groupId){
    try{
      const getClustersInGroup = await this.fiwareService.getCarClusterByGroupRef(groupId)
      if(getClustersInGroup.length){
        throw new Error('There are clusters assigned to this Group, please delete them')
      }
      let group = await this.fiwareService.deleteCarGroup(groupId)
      return group
    }catch (error){
      throw error
    }
  }

}

