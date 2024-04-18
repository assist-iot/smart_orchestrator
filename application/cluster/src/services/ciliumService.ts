import { Container, Service, Inject } from 'typedi';
import * as k8s from '@kubernetes/client-node';
import KubeService from './auxiliar/kubeService';
import MongoService from './auxiliar/mongoService';

@Service()
export default class CiliumService {
  constructor(
    public kubeService: KubeService,
    public mongoService: MongoService
  ) {}
  
  /**
   * Prepares the clusters for the Cilium clustermesh connection.
   * 
   * @param kc The Kubeconfig object for the clusters.
   * @param clusterName The name of the cluster (must be unique for each cluster).
   * @param clusterId The ID of the cluster (must be unique for each cluster).
   */
  public async ciliumClustermeshConnectionLogic(clusterUid,cluster,kc){
    try{
      let clusters = await this.mongoService.getAllClustersDb()
      let cloudClusterArray = clusters.filter(c => (c.cloud == true && c.status == 'Pending Cilium') || (c.cloud == true && c.status == 'Enabled') )
      const [cloudCluster] = cloudClusterArray

      let clusterName = cluster.name
      let clusterId = clusters.length
      

      await this.createClusterNameAndClusterId(clusterName,clusterId,kc)

      if (cloudClusterArray.length){
        if (cloudCluster.name == cluster.name){
          let cloudClusterUid = cloudCluster.uid
          let clustersToConnect = clusters.filter(cluster => cluster.cloud == false && cluster.status == 'Paused' )
          for (let clusterToConnect of clustersToConnect){
            let clusterToConnectUid = clusterToConnect.uid
            await this.connectClustersClustermesh(cloudCluster,clusterToConnect)
            await this.mongoService.updateClusterDb(clusterToConnectUid,'Enabled')
          }
          await this.mongoService.updateClusterDb(cloudClusterUid,'Enabled')
        }else{
          await this.connectClustersClustermesh(cloudCluster,cluster)
          await this.mongoService.updateClusterDb(clusterUid,'Enabled')
        }
      }else{
        await this.mongoService.updateClusterDb(clusterUid,'Paused')
      }
    }catch (e){
      e.name = "Cilium"
      throw e
    }
  }
  /**
   * Prepares the clusters for establishing the Cilium clustermesh connection.
   * 
   * @param kc The Kubeconfig object for the clusters.
   * @param clusterName The name of the cluster (must be unique for each cluster).
   * @param clusterId The ID of the cluster (must be unique for each cluster).
   */
  public async createClusterNameAndClusterId(clusterName, clusterId, kc) {
    try{
      let k8sApi = kc.makeApiClient(k8s.AppsV1Api);
      let deploymentName = 'clustermesh-apiserver';
      let namespace = 'kube-system';
    
      let { body: deployment } = await k8sApi.readNamespacedDeployment(deploymentName, namespace);
    
      deployment.metadata = { labels: deployment.metadata.labels, name: deployment.metadata.name };
      deployment.spec.template.spec.containers[1].args[0] = `--cluster-name=${clusterName}`;
      deployment.spec.template.spec.containers[1].args[1] = `--cluster-id=${clusterId}`;
    
      await k8sApi.replaceNamespacedDeployment(deploymentName, namespace, deployment);
      await this.kubeService.patchConfigMap(kc,clusterName,clusterId)
    }catch (e) {
      throw e
    }   
  }
  /**
   * Connects the cloud cluster with the edge cluster.
   * 
   * @param cloudCluster The name of the cloud cluster.
   * @param clusterToConnect The name of the edge cluster.
   */
  public async connectClustersClustermesh(cloudCluster,clusterToConnect){
    try{
      let kcCloud = await this.kubeService.loadKubeConfig(cloudCluster.credentials)
      let kcEdge= await this.kubeService.loadKubeConfig(clusterToConnect.credentials)

      let [hostAliasesCloud,secretsCloud] = await this.getClusterInfo(cloudCluster,kcCloud)

      kcCloud.setCurrentContext(kcCloud.getCurrentContext())

      await this.applyClusterInfo(hostAliasesCloud,secretsCloud,clusterToConnect,kcEdge)
      await this.kubeService.deleteCiliumPods(kcEdge)

      let [hostAliasesEdge,secretsEdge] = await this.getClusterInfo(clusterToConnect,kcEdge)

      kcCloud.setCurrentContext(kcCloud.getCurrentContext());

      await this.applyClusterInfo(hostAliasesEdge,secretsEdge,cloudCluster,kcCloud)
      await this.kubeService.deleteCiliumPods(kcCloud)

    }catch (e) {
      throw e
    }
  }
  /**
   * Logic to disconnect the cloud cluster of the edge cluster.
   * 
   * @param uid Cluster uid to be disconnected.
   */
  public async ciliumClustermeshDisconnectionLogic(uid){
    let clusters = await this.mongoService.getAllClustersDb()
    let cloudClusterArray = clusters.filter(c => (c.cloud == true))
    let [cloudCluster] = cloudClusterArray
    try{
      let cluster = await this.mongoService.getClusterByIdDb(uid)
      await this.disconnectClustersClustermesh(cloudCluster,cluster)
    }catch (e){
      e.name = "Cilium"
      throw e
    }
  }
  /**
   * Disconnects the cloud cluster of the edge cluster.
   * 
   * @param cloudCluster Name of the cloud cluster.
   * @param clusterToDisconnect Name of the edge cluster.
   */
  public async disconnectClustersClustermesh(cloudCluster,clusterToDisconnect){
    try{
      let kcCloud = await this.kubeService.loadKubeConfig(cloudCluster.credentials)
      let kcEdge= await this.kubeService.loadKubeConfig(clusterToDisconnect.credentials)
      
      await this.deleteClusterInfo(cloudCluster,kcEdge)
      await this.kubeService.deleteCiliumPods(kcEdge)

      kcCloud.setCurrentContext(kcCloud.getCurrentContext())

      await this.deleteClusterInfo(clusterToDisconnect,kcCloud)
      await this.kubeService.deleteCiliumPods(kcCloud)

    }catch (e) {
      return e
    }
  }
  /**
   * Create the Cilium Network Policy
   * 
   * @param cluster Name of the cluster.
   * @param kc The Kubeconfig object for the clusters.
   */
  public async createCiliumNetworkPolicy(cluster,kc){
      let cnp={
        "apiVersion": "cilium.io/v2",
        "kind": "CiliumNetworkPolicy",
        "metadata": { "name": `external-components-${cluster.name}` },
        "spec": {
          "endpointSelector": {
            "matchLabels": {"isMainInterface": "yes"}
          },
          "ingress": [
            {
              "fromEndpoints": [
                {
                  "matchLabels": {
                    "isMainInterface": "yes",
                    "k8s:io.kubernetes.pod.namespace": "asdo"
                  }
                },
                {
                  "matchLabels": {
                    "isMainInterface": "yes",
                    "k8s:io.kubernetes.pod.namespace": "default"
                  }
                }
              ]
            }
          ]
        }
      }
      await this.kubeService.createNetworkPolicy(kc,cnp)
  }

    /**
   * Create the Cilium Network Policy
   * 
   * @param cluster Name of the cluster.
   * @param kc The Kubeconfig object for the clusters.
   */
    public async deleteCiliumNetworkPolicy(cluster){
        let kc = await this.kubeService.loadKubeConfig(cluster.credentials)
        await this.kubeService.deleteNetworkPolicy(cluster,kc)
    }
  /**
   * Retrieves the host aliases and secret data required for establishing the clustermesh connection.
   * 
   * @param cluster Cluster DB object from which the data is extracted.
   * @param kc Name of the edge cluster.
   */
  private async getClusterInfo(cluster,kc){
    try{
      let hostAliases = await this.createHostAliases(cluster)
      let secrets = await this.createSecretCiliumClustermesh(cluster,kc)
      return [hostAliases,secrets]
    }catch (e) {
      throw e
    }
  }
  /**
   * Utilizes the cluster information within the cluster to establish the connection.
   * 
   * @param hostAliases Object containing host aliases.
   * @param secrets Secret related to Cilium clustermesh.
   * @param cluster Name of the target cluster for the connection.
   * @param kc The kubeconfig object.
   */
  private async applyClusterInfo(hostAliases, secrets, cluster, kc){
    try{
      await this.kubeService.applyHostAliases(hostAliases,kc)
      await this.kubeService.applyClustermeshSecrets(secrets,cluster,kc)
    }catch (e) {
      throw e
    }
  }
  /**
   * Deletes the cluster information to disable the connection.
   * 
   * @param cluster Object DB of the ClusterConnectionEstablisher.
   * @param kc Name of the kubeconfig cluster.
   */
  private async deleteClusterInfo(cluster, kc){
    try{
      await this.kubeService.deleteHostAliases(cluster,kc)
      await this.kubeService.deleteClustermeshSecrets(cluster,kc)
    }catch (e) {
      return e
    }
  }
  /**
   * Creates the host Aliases object.
   * 
   * @param cluster Object DB of the ClusterConnectionEstablisher.
   * @returns The host aliases object. 
   */
  private async createHostAliases(cluster){
    try{
      let [clusterIp] = cluster.credentials.clusters
      let ip = clusterIp.cluster.server.split('/')[2].split(':')[0]
      let context = cluster.name
      
      let hostAliases = {
        "ip": ip,
        "hostnames": [
          `${context}.mesh.cilium.io`
        ]
      }
      return hostAliases
    }catch (e){
      throw e
    }
  }
  /**
   * Creates the host Aliases object.
   * 
   * @param cluster Object DB of the ClusterConnectionEstablisher.
   * @param kc Kubeconfig object.
   * @returns The cilium-clustermesh secret.
   */
  private async createSecretCiliumClustermesh(cluster,kc){
    try{
      let context = cluster.name
      let svcPort = await this.kubeService.getServicePort(kc)
      let [ciliumCertificate, clustermeshApiServer] = await this.kubeService.getSecretsClustermesh(kc)
    
      const strEtcdConfig = `endpoints:
- https://${context}.mesh.cilium.io:${svcPort}
trusted-ca-file: /var/lib/cilium/clustermesh/${context}-ca.crt
cert-file: /var/lib/cilium/clustermesh/${context}.crt
key-file: /var/lib/cilium/clustermesh/${context}.key`
    
      const etcdConfig = Buffer.from(strEtcdConfig).toString('base64');
      const caCrt = ciliumCertificate.body.data['ca.crt'];
      const tlsCrt = clustermeshApiServer.body.data['tls.crt'];
      const tlsKey = clustermeshApiServer.body.data['tls.key'];
    
      let secretData = {
          [context]: etcdConfig,
          [`${context}-ca.crt`]: caCrt,
          [`${context}.crt`]: tlsCrt,
          [`${context}.key`]: tlsKey
      }
    
      let secret = new k8s.V1Secret()
      secret.apiVersion = 'v1'
      secret.kind = 'Secret'
      secret.metadata = {
        name: 'cilium-clustermesh'
      }
      secret.type = 'Opaque';
      secret.data = secretData
    
      return secret
    } catch (e) {
      throw e
    }
  
  }


}