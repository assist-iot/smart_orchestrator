import { Service, Inject } from 'typedi';
import KubeService from './auxiliar/kubeService';
import MongoService from './auxiliar/mongoService';
import PrometheusService from './auxiliar/prometheusService';
import CiliumService from './ciliumService';
import EnablerService from './auxiliar/enablerService';

@Service()
export default class ClusterService {
  constructor(
    public kubeService: KubeService,
    public mongoService: MongoService,
    public prometheusService: PrometheusService,
    public ciliumService: CiliumService,
    public enablerService: EnablerService
  ) {}

  public async getClusters(){
    try{
      let clusters = await this.mongoService.getAllClustersDb()
    return clusters
    }catch (error){
      throw error
    }
  }

  public async getClustersById(uid){
    try{
      let cluster = await this.mongoService.getClusterByIdDb(uid)
    return cluster
    }catch (error){
      throw error
    }
  }

  public async getCloudCluster(){
    try{
      let cluster = await this.mongoService.getCloudCluster()
    return cluster
    }catch (error){
      throw error
    }
  }

  public async postClusters(cluster){
    let uid
    cluster.credentials.contexts[0].context.namespace = 'default'
    try{
      uid = await this.mongoService.createClusterDb(cluster,'Pending')

      let kc = await this.kubeService.loadKubeConfig(cluster.credentials)
      await this.kubeService.getKubernetesVersion(kc)
      await this.kubeService.getDefaultStorageClass(kc)
      await this.kubeService.getDefaultCni(cluster.cni,kc)
      if (cluster.cni == "flannel"){
        await this.prometheusService.createTargetPrometheus(cluster.name,cluster.credentials)
        await this.mongoService.updateClusterDb(uid,'Enabled')
      }else{
        await this.prometheusService.createTargetPrometheus(cluster.name,cluster.credentials)
        await this.mongoService.updateClusterDb(uid,'Pending Cilium')
        await this.ciliumService.ciliumClustermeshConnectionLogic(uid,cluster,kc)
        await this.ciliumService.createCiliumNetworkPolicy(cluster,kc)
      }
      return {uid}
    }catch (error){
      if (error.name == 'Cilium'){
        await this.mongoService.updateClusterDb(uid,'Degraded')
      }else{
        await this.mongoService.updateClusterDb(uid,'Error')
      }
      throw error
    }
  }

  public async deleteCluster(uid, headers){
    try{
      let {force} = headers

      let cluster = await this.mongoService.getClusterByIdDb(uid)
      if (cluster.cloud == true){
        await this.checkEdgeRegistered()
      }
      if (force == 'false'){
        await this.checkEnablerByCluster(uid)
      }else{
        await this.deleteEnablersByCluster(uid)
      }
      let clusterStatus = cluster.status
      switch (clusterStatus){
        case 'Enabled':
        case 'Degraded':
          await this.ciliumService.ciliumClustermeshDisconnectionLogic(uid)
          await this.mongoService.deleteClusterDb(uid)
          await this .prometheusService.deleteTargetsPrometheus(cluster)
          await this.ciliumService.deleteCiliumNetworkPolicy(cluster)
          break
        case 'Paused':
        case 'Pending Cilium':
        case 'Error':
          await this.mongoService.deleteClusterDb(uid)
          await this .prometheusService.deleteTargetsPrometheus(cluster)
          break
      }
      return {uid}
     }catch (error) {
       console.log(error)
       throw error
     }
    }

  public async getNodeByCluster(uid){
    try{
      let cluster = await this.mongoService.getClusterByIdDb(uid)
      let kc = await this.kubeService.loadKubeConfig(cluster.credentials)
      let nodes = await this.kubeService.getNodesList(kc)
      return nodes.body.items.map(item => {
        return {
          "name": item.metadata["name"],
          "labels": item.metadata["labels"]
        }
      })
     }catch (error) {
       await this.mongoService.updateClusterDb(uid,'Degraded')
       throw error
     }
  }

  private async checkEdgeRegistered(){
    try{
      let clusters = await this.mongoService.getAllClustersDb()
      let edgeClusterArray = clusters.filter(c => (c.cloud == false))
      if (!edgeClusterArray.length){
        return
      }else{
        throw new Error('Cloud cluster can not be uninstalled, please delete edge clusters first')
      }
    }catch (error) {
      throw error
    }
  }

  private async checkEnablerByCluster(uid){
    try{
      let clusters = await this.enablerService.getEnablersByCluster(uid)
      if (!clusters.length){
        return
      }else{
        throw new Error('Cluster has enablers installed, please deleted them first')
      }
    }catch (error) {
      throw error
    }
  }

  private async deleteEnablersByCluster(uid){
    try{
      await this.enablerService.deleteEnablersInCluster(uid)
    }catch (error) {
      throw error
    }
  }
}

