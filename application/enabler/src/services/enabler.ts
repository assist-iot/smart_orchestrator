import { Service, Inject } from 'typedi';
import HelmService from './auxiliar/helmService';
import MongoService from './auxiliar/mongoService';
import ClusterService from './auxiliar/clusterService';
import KubeService from './auxiliar/kubeService';
import CiliumService from './auxiliar/ciliumService';


@Service()
export default class EnablerService {
  constructor(
    public helmService: HelmService,
    public mongoService: MongoService,
    public clusterService: ClusterService,
    public kubeService: KubeService,
    public ciliumService: CiliumService
  ) {}

  public async getEnabler(){
    try{
      let enablers = await this.mongoService.getAllEnablerDb()
      return enablers
    }catch (error){
      throw error
    }
  }

  public async getEnablerByCluster(cluster){
    try{
      let enablers = await this.mongoService.getEnablerByClusterDb(cluster)
      return enablers
    }catch (error){
      throw error
    }
  }

  public async postEnabler(enabler){
    let uid
    let { values, ...HeadersPostEnabler} = enabler
    let version = HeadersPostEnabler.version !== '' ? HeadersPostEnabler.version : 'latest'
    try{
      let credentials = await this.clusterService.getCredentials(enabler.cluster)
      uid = await this.mongoService.createEnablerDb(enabler, 'Pending')
      await this.helmService.PostEnabler(HeadersPostEnabler,credentials, values)
      await this.mongoService.updateEnablerDb(uid,'Enabled','', version)
      await this.ciliumService.createCiliumNetworkPolicy(enabler,credentials)
      return {uid}
    }catch (error){
      if (uid !== undefined){
        await this.mongoService.updateEnablerDb(uid,'Error',error.response.data.msg, version)
      }
      throw error
    }
  }

  public async upgradeEnabler(uid,enabler){
    let { values, ...HeadersPostEnabler} = enabler
    let version = HeadersPostEnabler.version !== '' ? HeadersPostEnabler.version : 'latest'
    try{
      let {name,helmChart,cluster} = await this.mongoService.getEnablerByIdDb(uid)
      let credentials = await this.clusterService.getCredentials(cluster)
      await this.helmService.UpgradeEnabler(name,helmChart,HeadersPostEnabler,credentials, values)
      await this.mongoService.updateEnablerDb(uid,'Enabled','',version)
      return {uid}
    }catch (error){
      if (error.response && error.response.data.msg === 'context deadline exceeded') {
        await this.mongoService.updateEnablerDb(uid,'Error',error.response.data.msg, version)
      }
      throw error
    }
  }

  public async deleteEnabler(uid, headerDelete ){
    try{
      let {force} = headerDelete
      if(force == 'false'){
        let {cluster, name} = await this.mongoService.getEnablerByIdDb(uid)
        let credentials = await this.clusterService.getCredentials(cluster)
        await this.helmService.DeleteEnabler(name,headerDelete,credentials)
        await this.ciliumService.deleteCiliumNetworkPolicy(name,credentials)
        await this.mongoService.deleteEnablerDb(uid)
        return {uid}
      }else{
        await this.mongoService.deleteEnablerDb(uid)
        return {uid}
      }

    }catch (error){
      throw error
    }
  }

  public async deleteEnablerByCluster(cluster){
    try{
      await this.mongoService.deleteEnablerByClusterDb(cluster)
      return
    }catch (error){
      throw error
    }
  }
  
  public async deletePVC(uid){
    try{
      let {cluster, name} = await this.mongoService.getEnablerByIdDb(uid)
      let credentials = await this.clusterService.getCredentials(cluster)
      let kube = await this.kubeService.loadKubeConfig(credentials)
      let volumes = await this.kubeService.getVolumes(kube,name)     
      volumes.forEach(async volume => {
        await this.kubeService.deletePVC(kube,volume.metadata.name)
        await this.kubeService.deletePV(kube,volume.spec.volumeName)          
      });
      return {uid}
    }catch (error){
      throw error
    }
  }
}
