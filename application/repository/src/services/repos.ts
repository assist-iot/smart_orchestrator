import { Service, Inject } from 'typedi';
import HelmService from './auxiliar/helmService';
import MongoService from './auxiliar/mongoService';


@Service()
export default class RepoService {
  constructor(
    public helmService: HelmService,
    public mongoService: MongoService,
  ) {}

  public async getRepos(){
    try{
      let repositories = await this.mongoService.getAllRepoDb()
      return repositories
    }catch (error){
      throw error
    }
  }

  public async postRepo(repo, type){
    let uid
    const dataPostRepo = {
      'Name': repo.name,
      'URL': repo.url
    }    
    
    if (type !== 'public') {
      dataPostRepo.Username = repo.auth.username;
      dataPostRepo.Password = repo.auth.password;
    }
    try{
      uid = await this.mongoService.createRepoDb(repo, type, 'Pending')
      await this.helmService.PostRepository(dataPostRepo, type)
      await this.mongoService.updateRepoDb(uid,'Enabled')
      return {uid}
    }catch (error){
      await this.mongoService.updateRepoDb(uid,'Degraded')
      throw error
    }
  }

  public async updateIndexRepo(){
    try{
      let response = await this.helmService.UpdateIndexRepository()
      return response
    }catch (error){
      throw error
    }
  }

  public async deleteRepo(uid){
    try{
      let repo = await this.mongoService.getRepoByIdDb(uid)
      await this.mongoService.deleteRepoDb(uid)
      await this.helmService.DeleteRepository(repo.name)
      return {uid}
     }catch (error) {
       throw error
     }
  }

  public async getChartsByRepo(uid){
    try{
      let repo = await this.mongoService.getRepoByIdDb(uid)
      let result = await this.helmService.getChartsByRepository(repo.name)
      return this.getChartAndVersions(result)
     }catch (error) {
       throw error
     }
  }

  private async getChartAndVersions(charts){
    const chartsByRepo = {};

    for (const item of charts) {
      const { Chart } = item;
      const name = Chart.name;
      const version = Chart.version;

      // Si el grupo para este "name" aún no existe, créalo
      if (!chartsByRepo[name]) {
          chartsByRepo[name] = {
              Name: name,
              versions: []
          };
      }
  
      // Agrega la versión al grupo correspondiente
      chartsByRepo[name].versions.push(version);
    }
    const chartAndVersions = Object.values(chartsByRepo);
    return chartAndVersions
  }
  
}

