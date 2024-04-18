import { Container, Service, Inject } from 'typedi'
import * as k8s from '@kubernetes/client-node'

@Service()
export default class KubeService {
  constructor(
  ) {}
  /**
   * Creates a kubeconfig object for establishing a connection with a cluster.
   * 
   * @param kubeconfig Cluster authentication credentials.
   * @returns Kubeconfig object.
  */
  public async loadKubeConfig(kubeconfig){
    try{
      const kc = new k8s.KubeConfig()
      kc.loadFromString(JSON.stringify(kubeconfig))
      return kc
    }catch (error){
      throw error
    }
  }
  /**
   * Checks if Kubernetes is installed by retrieving the Kubernetes version.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getKubernetesVersion(kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.VersionApi)
      await  k8sApi.getCode()
    }catch(error){
      throw error
    }
  }
  /**
   *Checks if a default StorageClass is installed by retrieving the StorageClass using its annotations.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getDefaultStorageClass(kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.StorageV1Api)
      let response = await k8sApi.listStorageClass()
      let storageDefaultClass = response.body.items.filter(storageclass => storageclass.metadata.annotations['storageclass.kubernetes.io/is-default-class'] === 'true')
      if(!storageDefaultClass.length){
        throw new Error('Storageclass is not installed')
      }
      return response
    }catch (error) {
      throw error
    }
  }
  /**
   * Checks if Cilium is installed by searching for the Cilium clustermesh pod.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getDefaultCni(cni,kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
      if (cni == "flannel"){
        let response = await k8sApi.listNamespacedPod('kube-flannel')
        let flannel = response.body.items.filter(pod => pod.metadata.name.startsWith('kube-flannel'))
        if(!flannel.length){
          throw new Error('Flannel is not installed')
        }
        return response
      }else{
        let response = await k8sApi.listNamespacedPod('kube-system')
        let ciliumClustermesh = response.body.items.filter(pod => pod.metadata.name.startsWith('clustermesh-apiserver'))
        if(!ciliumClustermesh.length){
          throw new Error('Cilium is not installed')
        }
        return response
      }
    }catch (error) {
      throw error
    }

  }
  /**
   * Gets the master and worker nodes in a cluster.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getNodesList(kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
      let nodes = await k8sApi.listNode()
      return nodes
    }catch (error) {
      throw error
    }
  }
  /**
   * Creates or Replace the host Aliases object in the cilium DaemonSet.
   * 
   * @param hostAliasesObj Host Aliases object.
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async applyHostAliases(hostAliasesObj, kc) {
    const k8sApi = kc.makeApiClient(k8s.AppsV1Api)
    const daemonSetName = 'cilium'
    const namespace = 'kube-system'
  
    try {
      const patchDaemon = await k8sApi.readNamespacedDaemonSet(daemonSetName, namespace)
      const hostAliases = patchDaemon.body.spec.template.spec.hostAliases || []
  
      const existingIndex = hostAliases.findIndex(alias =>
        alias.ip === hostAliasesObj.ip && alias.hostnames.includes(hostAliasesObj.hostnames[0])
      )
  
      if (existingIndex !== -1) {
        hostAliases[existingIndex] = hostAliasesObj
      } else {
        hostAliases.push(hostAliasesObj)
      }
  
      patchDaemon.body.spec.template.spec.hostAliases = hostAliases
  
      await k8sApi.replaceNamespacedDaemonSet(daemonSetName, namespace, patchDaemon.body)
    } catch (error) {
      throw error
    }
  }
  /**
   * Creates or replace the cilium-clustermesh secret.
   * 
   * @param secrets Cilium-clustermesh secret
   * @param cluster Cluster DB object.
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async applyClustermeshSecrets(secrets,cluster, kc){

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
    try {
      await k8sApi.createNamespacedSecret('kube-system', secrets)
    } catch (error) {
      const clustermeshSecret = await k8sApi.readNamespacedSecret('cilium-clustermesh', 'kube-system', secrets)
      if (Object.keys(clustermeshSecret.body.data)[0] == cluster) {
        return
      } else {
        secrets.data = { ...clustermeshSecret.body.data, ...secrets.data }
        await k8sApi.replaceNamespacedSecret('cilium-clustermesh', 'kube-system', secrets)
      }
    }
  }
  /**
   * Deletes the host Aliases cluster object.
   * 
   * @param cluster Cluster DB object.
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async deleteHostAliases(cluster,kc) {
    
    const k8sApi = kc.makeApiClient(k8s.AppsV1Api)
    const daemonSetName = 'cilium'
    const namespace = 'kube-system'
  
    try {
      const patchDaemon = await k8sApi.readNamespacedDaemonSet(daemonSetName, namespace)
      const hostAliases = patchDaemon.body.spec.template.spec.hostAliases || []
      const hostname = `${cluster.name}.mesh.cilium.io`

      const existingIndex = hostAliases.findIndex(alias =>
       alias.hostnames.includes(hostname)
      )
      if (existingIndex !== -1) {
        hostAliases.splice(existingIndex, 1)
      }
  
      patchDaemon.body.spec.template.spec.hostAliases = hostAliases
      await k8sApi.replaceNamespacedDaemonSet(daemonSetName, namespace, patchDaemon.body)
    } catch (error) {
      return
    }
  }
  /**
   * Deletes the cilium-clustermesh secret or replace deleting keys.
   * 
   * @param cluster Cluster DB object.
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async deleteClustermeshSecrets(cluster, kc){

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
    try {
      let secrets = await k8sApi.readNamespacedSecret('cilium-clustermesh','kube-system')
      removeKeysSecretData(secrets,cluster.name)
      if (Object.keys(secrets.body.data).length === 0){
        await k8sApi.deleteNamespacedSecret('cilium-clustermesh', 'kube-system')
      }else{
        await k8sApi.replaceNamespacedSecret('cilium-clustermesh', 'kube-system', secrets.body)
      }
      function removeKeysSecretData(secrets, prefix) {
        for (let key in secrets.body.data) {
          if (key ===  prefix || key === `${prefix}-ca.crt` || key === `${prefix}.crt` || key === `${prefix}.key`) {
            delete secrets.body.data[key]
          }
        }
      }
    } catch (error) {
      return
    }
  }
  /**
   * Delete the pods with the labels "k8s-app=cilium" and "name=cilium-operator".
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async deleteCiliumPods(kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
      const labels = ["k8s-app=cilium", "name=cilium-operator"]
      for (const label of labels) {
        const podsToDelete = await k8sApi.listNamespacedPod('kube-system', undefined, undefined, undefined, undefined, label)
        await k8sApi.deleteNamespacedPod(podsToDelete.body.items[0].metadata.name, 'kube-system')
      }
    }catch (error) {
      return error
    }
  }
  /**
   * Retrieves the cilium certificate and the clustermesh api server.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getSecretsClustermesh(kc){
    try{
      const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
      let ciliumCertificate = await k8sApi.readNamespacedSecret('cilium-ca', 'kube-system')
      let clustermeshApiServer = await k8sApi.readNamespacedSecret('clustermesh-apiserver-remote-cert', 'kube-system')
      return [ciliumCertificate, clustermeshApiServer]
    }catch (error) {
      throw error
    }
  }
  /**
   * Retrieves the Clustermesh API server port.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
  */
  public async getServicePort(kc) {
    try{
      const k8sApiCore = kc.makeApiClient(k8s.CoreV1Api)
      const { body } = await k8sApiCore.readNamespacedService('clustermesh-apiserver', 'kube-system')
      const port = body.spec.ports[0]?.nodePort || null
      return port
    } catch (error) {
      throw error
    }
  }
    /**
   * Patch Configmap.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
   * @param clusterName Cluster name.
   * @param clusterId Cluster ID.
  */
    public async patchConfigMap(kc, clusterName, clusterId) {
      const headers = { 'content-type': 'application/strategic-merge-patch+json' };
      try{
        const k8sApiCore = kc.makeApiClient(k8s.CoreV1Api)
        await k8sApiCore.patchNamespacedConfigMap('cilium-config','kube-system',{ data: { "cluster-name": clusterName, "cluster-id": `${clusterId}` }},undefined, undefined, undefined, undefined, { headers })
      } catch (error) {
        throw error
      }
    }

  /**
   * Create Custom Object Network Policy.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
   * @param body CNP body.
  */
  public async createNetworkPolicy(kc, body) {
    try{      
      const k8sApiCore = kc.makeApiClient(k8s.CustomObjectsApi)
      await k8sApiCore.createNamespacedCustomObject("cilium.io","v2","default","ciliumnetworkpolicies",body)
    } catch (error) {
      return
    }
  }
  /**
   * Delete Custom Object.
   * 
   * @param kc Kubeconfig object for connecting to the cluster.
   * @param cluster Cluster DB object.
  */
  public async deleteNetworkPolicy(cluster,kc) {
    try{      
      const k8sApiCore = kc.makeApiClient(k8s.CustomObjectsApi)
      await k8sApiCore.deleteNamespacedCustomObject("cilium.io","v2","default","ciliumnetworkpolicies",`external-components-${cluster.name}`)
    } catch (error) {
      return
    }
  }

}