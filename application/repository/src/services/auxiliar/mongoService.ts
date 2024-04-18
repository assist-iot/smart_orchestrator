import { Service, Inject } from 'typedi';
import { IRepo } from '@/interfaces/IRepo';
import {v4 as uuidv4} from 'uuid';


@Service()
export default class MongoService {
  constructor(
    @Inject('repoModel') private repoModel: Models.RepoModel
  ) {}
  /**
   * Creates a repository in the DB
   * 
   * @param repo JSON object representing the repository.
   * @param status Status of the repository.
   * @param type Type of the repository (public or private)
   * @returns UID of the created repository.
  */
  public async createRepoDb(repo: IRepo, type, status){
    let uid = uuidv4();

    try{
      await this.repoModel.create(
        { 
          uid,
          ...repo,
          type,
          status
        }
      );
      return uid
    }catch (error) {
      throw error
    }
  }
  /**
   * Updates a repository in the DB
   * 
   * @param uid UID of the repository to update.
   * @param status Status of the repository.
   * @returns UID of the updated repository.
  */
  public async updateRepoDb(uid,status){
    try{
      await this.repoModel.updateOne(
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
   * Gets all repositories in the DB
  */
  public async getAllRepoDb(){
    try{
     return await this.repoModel.find({});
    }catch (error) {
      throw error
    }
  }
  /**
   * Get a repository in the DB by uid.
   * 
   * @param uid UID of the repository to get.
   * @returns repository DB object.
  */
  public async getRepoByIdDb(uid){
    try{
      let repo =await this.repoModel.findOne({uid});
      if(!repo){ 
        throw new Error(`Repo with uid ${uid} does not exist`)
      }
      return repo
     }catch (error) {
       throw error
     }
  }
  /**
   * Deletes a repository in the DB
   * 
   * @param uid UID of the repository to delete.
  */
  public async deleteRepoDb(uid){
    try{
      await this.repoModel.findOneAndDelete({uid});
     }catch (error) {
       throw error
     }
  }
 
}

