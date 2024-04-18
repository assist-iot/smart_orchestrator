import { Service } from 'typedi';
import KubeService from './kubeService';

@Service()
export default class CiliumService {
  constructor(
    public kubeService: KubeService,
  ) {}
  
  /**
   * Create the Cilium Network Policy
   * 
   * @param cluster Name of the cluster.
   * @param kc The Kubeconfig object for the clusters.
  */
  public async createCiliumNetworkPolicy(enabler,credentials){
      let cnp={
        "apiVersion": "cilium.io/v2",
        "kind": "CiliumNetworkPolicy",
        "metadata": { "name": `internal-components-${enabler.name}` },
        "spec": {
          "endpointSelector": {
            "matchLabels": {"app.kubernetes.io/instance": `${enabler.name}`}
          },
          "ingress": [
            {
              "fromEndpoints": [
                {
                  "matchLabels": {"app.kubernetes.io/instance": `${enabler.name}`}
                }
              ]
            }
          ]
        }
      }
      try{
        let kc = await this.kubeService.loadKubeConfig(credentials)
        await this.kubeService.createNetworkPolicy(cnp, kc)
      }catch(error){
        return
      }  
  }

  /**
 * Create the Cilium Network Policy
 * 
 * @param cluster Name of the cluster.
 * @param kc The Kubeconfig object for the clusters.
 */
  public async deleteCiliumNetworkPolicy(enabler,credentials){
    try{
      let kc = await this.kubeService.loadKubeConfig(credentials)
      await this.kubeService.deleteNetworkPolicy(enabler,kc)
    }catch(error){
      return
    }
  }

}