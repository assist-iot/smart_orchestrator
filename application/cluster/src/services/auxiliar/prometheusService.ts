import { Container, Service, Inject } from 'typedi';
import config from '../../config';
import { promises as fs } from 'fs';

@Service()
export default class PrometheusService {
  constructor(
  ) {}
  /**
   * Populates the Prometheus dynamic configuration file with target entries.
   * 
   * @param credentials Authentication credentials of the added cluster.
   */
  async createTargetPrometheus(name, credentials) {
    let server = credentials.clusters[0].cluster.server;
    let ip = server.split('/')[2].split(':')[0];
    let target = {
        targets: [`${ip}:30090`],
        labels: {
        cluster_name: name,
        }
    };
    
    try {
        let targets = await fs.readFile(config.targetsProm, 'utf8')
        let prometheusTargets = targets == "" ? [] : JSON.parse(targets);

        if (!Array.isArray(prometheusTargets)) {
        throw new Error('Invalid targets JSON format');
        }
    
        prometheusTargets.push(target);
        await fs.writeFile(config.targetsProm, JSON.stringify(prometheusTargets));
        return prometheusTargets;
    } catch (error) {
        throw error
    }
  }
  /**
   * Removes the Prometheus targets from the dynamic configuration file.
   * 
   * @param cluster Cluster DB object.
   */
  public async deleteTargetsPrometheus(cluster) {
    try {
      const targetsPath = config.targetsProm;
  
      let targetsJson = await fs.readFile(targetsPath, 'utf8');
      targetsJson = JSON.parse(targetsJson);
  
      const clusterName = cluster.name;
      targetsJson = targetsJson.filter(target => target.labels.cluster_name !== clusterName);
  
      const str = JSON.stringify(targetsJson);
      await fs.writeFile(targetsPath, str);
  
      return targetsJson;
    } catch (error) {
      throw error
    }
  }
}

