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
     * Get persistent volume claims in a namespace.
     * 
     * @param kube Kubeconfig object for connecting to the cluster.
     */
    public async getVolumes(kube,name){
        let labelSelector = `app.kubernetes.io/instance=${name}`
        try {
            const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);
            let response = await coreV1Api.listNamespacedPersistentVolumeClaim('default',undefined, undefined, undefined, undefined, labelSelector)
            return response.body.items
        } catch (error) {
            throw error
        }
    }
    /**
     * Delete persistent volume claims in a namespace.
     * 
     * @param kube Kubeconfig object for connecting to the cluster.
     * @param pvc Persistent volume claim name
     */
    public async deletePVC(kube,pvc){
        try {
            const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);
            await coreV1Api.deleteNamespacedPersistentVolumeClaim(pvc,'default')
            return
        } catch (error) {
            throw error
        }
    }
    /**
     * Delete volume claims in a namespace.
     * 
     * @param kube Kubeconfig object for connecting to the cluster.
     * @param pv Persistent volume name
     */
    public async deletePV(kube,pv){
        try {
            const coreV1Api = kube.makeApiClient(k8s.CoreV1Api);
            await coreV1Api.deletePersistentVolume(pv)
            return
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
  public async createNetworkPolicy(body,kc) {
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
   * @param enabler Enabler name.
  */
  public async deleteNetworkPolicy(enabler,kc) {
    try{      
      const k8sApiCore = kc.makeApiClient(k8s.CustomObjectsApi)
      await k8sApiCore.deleteNamespacedCustomObject("cilium.io","v2","default","ciliumnetworkpolicies",`internal-components-${enabler}`)
    } catch (error) {
        return
    }
  }


}