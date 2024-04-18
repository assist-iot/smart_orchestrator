from kubernetes import client, config
from collections import defaultdict
from pint        import UnitRegistry
from prometheus_api_client import PrometheusConnect
import os
import math
import requests
from mongo import *
from mysql_conf import *
import numpy

helm_microservice = os.environ['HELM_MICROSERVICE']
helm_microservice_port = os.environ['HELM_MICROSERVICE_PORT']


timeout = 30

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
ureg.define('m = 1/1000 * kcpuunits')
ureg.define('k = 1000 * kcpuunits')
ureg.define('M = k^2')
ureg.define('G = k^3')
ureg.define('T = k^4')
ureg.define('P = k^5')
ureg.define('E = k^6')

def getMaximumReplicas(cluster, credentials, app_cpu_request, app_memory_request):
    totalAvailableCPU, totalAvailableMemory, available_resources_per_node = compute_available_resources(cluster, credentials)

    count = 0

    for node in available_resources_per_node:
        count += min(math.floor(node['cpu']/app_cpu_request), math.floor(node['memory']/app_memory_request))

    return count

def compute_available_resources(cluster, credentials):

    total_allocatable_cpu = 0
    total_allocatable_memory = 0

    available_cpu = 0
    available_memory = 0

    total_cpu_request = 0
    total_memory_request = 0

    core_v1 = client.CoreV1Api(api_client=config.new_client_from_config_dict(config_dict=credentials))

    available_resources_per_node = []

    try:
        for node in core_v1.list_node(_request_timeout=timeout).items[0:]:
            stats          = {}
            node_name      = node.metadata.name
            allocatable    = node.status.allocatable
            allocatabale_cpu = Q_(allocatable['cpu']).to('m')
            allocatable_memory = Q_(allocatable['memory'])
            total_allocatable_cpu += allocatabale_cpu
            total_allocatable_memory += allocatable_memory
            max_pods       = int(int(allocatable["pods"]) * 1.5)
            field_selector = ("status.phase!=Succeeded,status.phase!=Failed," +
                              "spec.nodeName=" + node_name)

            node_cpu_request = 0
            node_memory_request = 0

            pods = core_v1.list_pod_for_all_namespaces(limit=max_pods,
                                                       field_selector=field_selector).items
            cpureqs, memreqs = [], []
            for pod in pods:
                for container in pod.spec.containers:
                    res = container.resources
                    reqs = defaultdict(lambda: 0, res.requests or {})
                    cpureqs.append(Q_(reqs["cpu"]))
                    memreqs.append(Q_(reqs["memory"]))

            node_cpu_request += sum(cpureqs) #???
            node_memory_request += sum(memreqs)

            dict = {}
            # node_memory_request.to('Ki') probar a hacerlo antes de la resta siguiente a ver si el valor
            dict['name'] = node_name
            dict['cpu'] = float(allocatabale_cpu - node_cpu_request) * 1000 # Como hace esta operacion??
            dict['memory'] = float(str(allocatable_memory - node_memory_request)[:-2])
            available_resources_per_node.append(dict)

            total_cpu_request += Q_(node_cpu_request)
            total_memory_request += Q_(node_memory_request).to('Ki')
        available_cpu = total_allocatable_cpu - total_cpu_request
        available_memory = total_allocatable_memory - total_memory_request

        available_cpu = float(str(available_cpu)[:-2])
        available_memory = float(str(available_memory)[:-3])
    except:
        print("Connection timeout after " + str(timeout) + " seconds on cluster " + cluster)
    return available_cpu, available_memory, available_resources_per_node

def getPerNodeResources(cluster, credentials):

    perNodeCPU = 0
    perNodeMemory = 0

    client_cluster = client.CoreV1Api(api_client=config.new_client_from_config_dict(config_dict=credentials))

    try:
        nodes = client_cluster.list_node(_request_timeout=timeout)

        perNodeCPU = Q_(nodes.items[0].status.capacity['cpu']).to('m')
        perNodeMemory = Q_(nodes.items[0].status.capacity['memory']).to('Ki')
        perNodeCPU = float(str(perNodeCPU)[:-2])
        perNodeMemory = float(str(perNodeMemory)[:-3])
    except:
        print("Connection timeout after " + str(timeout) + " seconds to " + cluster)

    return perNodeCPU, perNodeMemory

def checkClusterPossibility(cluster, credentials, app_cpu_request, app_memory_request):
    cluster_per_node_cpu, cluster_per_node_memory = getPerNodeResources(cluster, credentials)
    if app_cpu_request >= cluster_per_node_cpu or app_memory_request >= cluster_per_node_memory:
        return False
    else:
        return True



def getFogAppLocations(app_cpu_request, app_memory_request, replicas, clusters_qty, placement_policy, mode, fogapp_replicas):
    clusters = getKubeconfigData()
    fog_only_clusters = clusters

    possible_clusters = []
    for cluster, credentials in fog_only_clusters.items():
        if checkClusterPossibility(cluster, credentials, app_cpu_request, app_memory_request) == True:
            possible_clusters.append(cluster)

    eligible_clusters = []
    if len(possible_clusters) == 0:
        eligible_clusters = []
    else:
        for cluster in possible_clusters:
            credentials = fog_only_clusters[cluster]
            if mode == 'create':
                maximum_replicas = getMaximumReplicas(cluster, credentials, app_cpu_request, app_memory_request)

            if maximum_replicas > 0:
                dict = {}

                dict['name'] = cluster
                dict['max_replicas'] = maximum_replicas
                eligible_clusters.append(dict)

    if len(eligible_clusters) == 0:
        fogapp_locations = []
        all_clusters = clusters

        for cluster in all_clusters:
            if 'cloud' in cluster:
                dict = {}
                dict['name'] = cluster
                dict['max_replicas'] = replicas * clusters_qty
                fogapp_locations.append(dict)
        return fogapp_locations
    else:
        sorted_eligible_clusters = []
        if placement_policy == 'most_traffic' or placement_policy == 'most-traffic':
            for cluster in eligible_clusters:

                query = Cluster.select().where((Cluster.name == cluster['name']) & (Cluster.is_real == 0))
                traffic = [cluster.traffic for cluster in query]
                if len(traffic) > 0:
                    cluster['ntk_rcv'] = numpy.mean(traffic)
                else:
                    cluster['ntk_rcv'] = 0.0

            sorted_eligible_clusters = sorted(eligible_clusters, key = lambda i: i['ntk_rcv'], reverse=True)

        elif placement_policy == 'worst_fit' or placement_policy == 'worst-fit':
            sorted_eligible_clusters = sorted(eligible_clusters, key=lambda i: i['max_replicas'], reverse=True)
        
        elif placement_policy == 'best_fit' or placement_policy == 'best-fit':
            sorted_eligible_clusters = sorted(eligible_clusters, key=lambda i: i['max_replicas'])
            query = Cluster.select().where((Cluster.name == sorted_eligible_clusters[0]['name']) & (Cluster.is_real == 0))
            data_unique = list(set([(cluster.cpu, cluster.ram) for cluster in query]))
            for data in data_unique:
                count = min(math.floor(data[0]/app_cpu_request), math.floor(data[1]/app_memory_request))
                overflow = fogapp_replicas - count
                if overflow > 0:
                    sorted_eligible_clusters = {}
                    return sorted_eligible_clusters

        fogapp_locations = []
        for cluster in sorted_eligible_clusters:
            dict = {}
            dict['name'] = cluster['name']
            dict['max_replicas'] = cluster['max_replicas']
            fogapp_locations.append(dict)

        return fogapp_locations

def normalizeData(cpu,memory):
    sumCpu = 0
    sumMemory = 0

    for cpu_request in cpu:
        if (str.isnumeric(cpu_request)):
            sumCpu += float(cpu_request)*1000
        else:
            sumCpu += float(str(float(cpu_request[:-1])*ureg(cpu_request[-1:]).to('m'))[:-2])
    
    for memory_request in memory:
            sumMemory += float(str(float(memory_request[:-2])*ureg(memory_request[-2:]).to('Ki'))[:-3])

    return sumCpu,sumMemory

def getMetrics(helmChart,placement_policy,externalValues):
    try:
        values = requests.get(f'http://{helm_microservice}:{helm_microservice_port}/enabler/values/',headers={"Chart":f'{helmChart}'}, json={})
        valuesJson = values.json()
        if "msg" in valuesJson: raise Exception (valuesJson)

        if not externalValues: pass
        else:
            for key, value in externalValues.items():
                if isinstance(value, dict) and key in valuesJson:
                    valuesJson[key].update(externalValues[key])
                else:
                    valuesJson.update(externalValues)

        normalizedData = {'cpu': [], 'memory': [], 'replicas': 0, 'placement_policy': ""}

        componentValues = [item for item in valuesJson.values() if isinstance(item, dict) and 'resources' in item]
        
        if not componentValues:
            componentValues = [valuesJson]

        for ob in componentValues:
            if 'requests' in ob['resources']:
                normalizedData['cpu'].append(ob['resources']['requests']['cpu'])
                normalizedData['memory'].append(ob['resources']['requests']['memory'])
            else:
                normalizedData['cpu'].append('100m')
                normalizedData['memory'].append('1028Mi')

        total_replicas = sum(value['replicaCount'] for value in componentValues)

        normalizedData['replicas'] = total_replicas
        normalizedData['placement_policy'] = placement_policy
    
    except:
        return valuesJson,404
    else:
        return normalizedData

def getKubeconfigData():
    cluster_dict = {}
    clustersDB = clientDB['clusterDB'].clusters
    for clusters in clustersDB.find():
        if clusters['cloud'] == True:
            pass
        else:
            cluster_dict[clusters['name']] = clusters['credentials']
    
    return cluster_dict
            
