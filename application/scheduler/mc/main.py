import os
import json
import yaml
from datetime import datetime
from kubernetes import client, config
from pint import UnitRegistry
from collections import defaultdict
from mysql_conf import *
from mongo_conf import *
from prom_conf import *

cluster_dict = {
}

ureg = UnitRegistry()
Q_ = ureg.Quantity

# Memory units
ureg.define('kmemunits = 1 = [kmemunits]')
ureg.define('Ki = 1024 * kmemunits')
ureg.define('Mi = Ki^2')
ureg.define('Gi = Ki^3')
ureg.define('Ti = Ki^4')
ureg.define('Pi = Ki^5')
ureg.define('Ei = Ki^6')

# cpu units
ureg.define('kcpuunits = 1 = [kcpuunits]')
ureg.define('n = 1/1000000000 * kcpuunits')
ureg.define('u = 1/1000000 * kcpuunits')
ureg.define('m = 1/1000 * kcpuunits')
ureg.define('k = 1000 * kcpuunits')
ureg.define('M = k^2')
ureg.define('G = k^3')
ureg.define('T = k^4')
ureg.define('P = k^5')
ureg.define('E = k^6')
   
def get_available_resources(cluster_dict):
    
    total_allocatable_cpu = 0
    total_allocatable_memory = 0

    available_cpu = 0
    available_memory = 0

    total_cpu_request = 0
    total_memory_request = 0

    try:
        core_v1 = client.CoreV1Api(api_client=config.new_client_from_config_dict(config_dict=cluster_dict))
        for node in core_v1.list_node(_request_timeout=30).items[0:]:
            stats          = {}
            node_name      = node.metadata.name
            allocatable    = node.status.allocatable
            allocatabale_cpu = Q_(allocatable['cpu']).to('m')
            allocatable_memory = Q_(allocatable['memory'])
            total_allocatable_cpu += allocatabale_cpu
            total_allocatable_memory += allocatable_memory
            max_pods       = int(int(allocatable["pods"]) * 1.5)
            field_selector = ("status.phase!=Succeeded,status.phase!=Failed," + "spec.nodeName=" + node_name)

            node_cpu_request = 0
            node_memory_request = 0

            pods = core_v1.list_pod_for_all_namespaces(limit=max_pods,field_selector=field_selector).items
            cpureqs, memreqs = [], []

            for pod in pods:
                for container in pod.spec.containers:
                    res = container.resources
                    reqs = defaultdict(lambda: 0, res.requests or {})
                    cpureqs.append(Q_(reqs["cpu"]))
                    memreqs.append(Q_(reqs["memory"]))

            node_cpu_request += sum(cpureqs)
            node_memory_request += sum(memreqs)
            total_cpu_request += Q_(node_cpu_request)
            total_memory_request += Q_(node_memory_request).to('Ki')

        available_cpu = int(float(str(total_allocatable_cpu - total_cpu_request)[:-2]))
        available_memory = int(float(str(total_allocatable_memory - total_memory_request)[:-3]))
    except:
        print('Error obtaining available resources')
    return available_cpu, available_memory

def set_available_resources(data):
    try:
        f = cluster.get((cluster.name == data['name']) & (cluster.timestamp == data['timestamp']))
    except cluster.DoesNotExist:
        cluster.create(**data)
    up = cluster.update(**data).where(
        (cluster.name == data['name']), 
        (cluster.timestamp == data['timestamp']),
        (cluster.is_real == 0)
    )
    up.execute()

def get_network_receive_bytes(cluster_name):
    query = "sum(instance:node_network_receive_bytes_excluding_lo:rate5m{cluster_name='" + cluster_name + "'})"
    result = pc.custom_query(query=query)
    if len(result) > 0:
        return float(result[0]['value'][1])
    else:
        return 0.0

def main():

  clustersDB = clientDB['clusterDB'].clusters
  for clusters in clustersDB.find():
    cluster_name = clusters['name']
    cluster_credentials = clusters['credentials']
    cpu, ram = get_available_resources(cluster_credentials)
    network_bytes = get_network_receive_bytes(cluster_name)
    now = datetime.now()

    data = {
      'name': cluster_name,
      'timestamp': now.replace(minute=(now.minute // 5) * 5,second=0,microsecond=0),
      'cpu': cpu,
      'ram': ram,
      'traffic': network_bytes,
      'is_real': 1
    }

    set_available_resources(data)
    db.close()
  
if __name__ == "__main__":
    main()