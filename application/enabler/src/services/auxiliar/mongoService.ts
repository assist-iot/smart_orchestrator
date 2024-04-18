import { Service, Inject } from 'typedi';
import { IEnabler } from '@/interfaces/IEnabler';
import {v4 as uuidv4} from 'uuid';


@Service()
export default class MongoService {
  constructor(
    @Inject('enablerModel') private enablerModel: Models.EnablerModel
  ) {}
  /**
   * Creates an enabler in the DB
   * 
   * @param enabler JSON object representing the enabler.
   * @param status Status of the enabler.
   * @returns UID of the created enabler.
  */
  public async createEnablerDb(enabler: IEnabler, status){
    let uid = uuidv4();

    try{
      await this.enablerModel.create(
        { 
          uid,
          ...enabler,
          status
        }
      );
      return uid
    }catch (error) {
      throw error
    }
  }
  /**
   * Updates an enabler in the DB
   * 
   * @param uid UID of the enabler to update.
   * @param status Status of the enabler.
   * @returns UID of the updated enabler.
  */
  public async updateEnablerDb(uid,status,description,version){
    try{
      await this.enablerModel.updateOne(
        {uid},
        { 
          status,
          description,
          version
        }
      )
      return uid
    }catch (error) {
      throw error
    }
  }
  /**
   * Gets all enabler in the DB
  */
  public async getAllEnablerDb(){
    try{
     return await this.enablerModel.find({});
    }catch (error) {
      throw error
    }
  }

  /**
   * Deletes an enabler in the DB
   * 
   * @param uid UID of the enabler to delete.
  */
  public async deleteEnablerDb(uid){
    try{
      await this.enablerModel.findOneAndDelete({uid});
      }catch (error) {
        throw error
      }
  }
    /**
   * Delete enablers in DB by cluster.
   * 
   * @param uid UID of the cluster.
  */
  public async deleteEnablerByClusterDb(cluster){
    try{
      await this.enablerModel.deleteMany({cluster});
      }catch (error) {
        throw error
      }
  }
  /**
   * Get an enabler in the DB by uid.
   * 
   * @param uid UID of the enabler to get.
   * @returns Enabler DB object.
  */
  public async getEnablerByIdDb(uid){
    try{
      let enabler =await this.enablerModel.findOne({uid});
      if(!enabler){ 
        throw new Error(`Enabler with uid ${uid} does not exist`)
      }
      return enabler
      }catch (error) {
        throw error
      }
  }
    /**
   * Get enablers in DB by cluster.
   * 
   * @param uid UID of the cluster to get.
   * @returns Enablers DB records.
  */
    public async getEnablerByClusterDb(cluster){
      try{
        let enabler =await this.enablerModel.find({cluster});
        if(!enabler){ 
          throw new Error(`Cluster with uid ${uid} does not exist`)
        }
        return enabler
        }catch (error) {
          throw error
        }
    }
}

