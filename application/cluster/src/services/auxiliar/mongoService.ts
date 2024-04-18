import { Service, Inject } from 'typedi';
import { ICluster } from '@/interfaces/ICluster';
import {v4 as uuidv4} from 'uuid';


@Service()
export default class MongoService {
  constructor(
    @Inject('clusterModel') private clusterModel: Models.ClusterModel
  ) {}
  /**
   * Creates a cluster in the DB
   * 
   * @param cluster JSON object representing the cluster.
   * @param status Status of the cluster.
   * @returns UID of the created cluster.
  */
  public async createClusterDb(cluster: ICluster, status){
    let uid = uuidv4();
    try{
      await this.clusterModel.create(
        { 
          uid,
          ...cluster,
          status
        }
      );
      return uid
    }catch (error) {
      throw error
    }
  }
  /**
   * Updates a cluster in the DB
   * 
   * @param uid UID of the cluster to update.
   * @param status Status of the cluster.
   * @returns UID of the updated cluster.
  */
  public async updateClusterDb(uid,status){
    try{
      await this.clusterModel.updateOne(
        {uid},
        { 
          status
        }
      )
      return uid
    }catch (error) {
      throw error
    }
  }
  /**
   * Gets all clusters in the DB
  */
  public async getAllClustersDb(){
    try{
     return await this.clusterModel.find({});
    }catch (error) {
      throw error
    }
  }
  /**
   * Get a cluster in the DB by uid.
   * 
   * @param uid UID of the cluster to get.
   * @returns Cluster DB object.
  */
  public async getClusterByIdDb(uid){
    try{
      let cluster =await this.clusterModel.findOne({uid});
      if(!cluster){ 
        throw new Error(`Cluster with uid ${uid} does not exist`)
      }
      return cluster
     }catch (error) {
       throw error
     }
  }
  /**
   * Get the cloud cluster.
   * 
   * @returns Cluster DB object.
  */
  public async getCloudCluster(){
    try{
      let cluster =await this.clusterModel.findOne({"cloud":true});
      if(!cluster){ 
        throw new Error(`Cloud cluster does not exist`)
      }
      return cluster
     }catch (error) {
       throw error
     }
  }
  /**
   * Deletes a cluster in the DB
   * 
   * @param uid UID of the cluster to delete.
  */
  public async deleteClusterDb(uid){
    try{
      await this.clusterModel.findOneAndDelete({uid});
     }catch (error) {
       throw error
     }
  }
 
}

