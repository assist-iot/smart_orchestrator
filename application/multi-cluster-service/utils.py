from kubernetes import client, config
from kubernetes.client.rest import ApiException
from collections import defaultdict
# from pint        import UnitRegistry
# from prometheus_api_client import PrometheusConnect
import yaml
import os 

# import pandas as pd
from pymongo import MongoClient

mongodb = os.getenv("MONGO_DB")
clientDB = MongoClient(mongodb, 27017)
# Load k8s contexts

timeout = 30

def createKubeConfigAndGetEdgeClusters():
    clusters_added = []
    kubeconfig = []
    clustersDB = clientDB['clusterDB'].clusters
    for post in clustersDB.find():
        if post['cloud'] == True:
            continue
        else:
            kubeconfig.append(post['credentials'])
            clusters_added.append(post['name'])
    return clusters_added,kubeconfig


def createService(cluster, service_body, namespace,kubeconfig):
    core_v1 = client.CoreV1Api(api_client=config.load_kube_config_from_dict(config_dict=kubeconfig))
    try:
        core_v1.create_namespaced_service(namespace=namespace, body=service_body, _request_timeout=timeout)
    except:
        print("Connection timeout after " + str(timeout) + " seconds when creating Service on " + cluster)


def deleteService(cluster, service_name, namespace, kubeconfig):
    core_v1 = client.CoreV1Api(api_client=config.load_kube_config_from_dict(config_dict=kubeconfig))
    try:
        core_v1.delete_namespaced_service(namespace=namespace, name=service_name, _request_timeout=timeout)
    except:
        print("Connection timeout after " + str(timeout) + " seconds when deleting Service from " + cluster)


def patchService(cluster, service_name, service_body, namespace):
    core_v1 = client.CoreV1Api(api_client=config.new_client_from_config(context=cluster))
    try:
        core_v1.patch_namespaced_service(namespace=namespace, name=service_name, body=service_body, _request_timeout=timeout)
    except:
        print("Connection timeout after " + str(timeout) + " seconds when patching Service on " + cluster)

def getServiceClusters(name, namespace):
    config.load_kube_config()
    api = client.CustomObjectsApi()

    group = 'assist.eu'
    version = 'v1'
    namespace = namespace
    plural = 'multiclusterservices'

    current_clusters = []
    original_clusters = []

    api_response = api.list_namespaced_custom_object(group=group, version=version, namespace=namespace, plural=plural)

    for item in api_response['items']:
        if item['metadata']['name'] == name:
            if item['status'] != "":
                if 'create_fn' in item['status']:
                    original_clusters = item['status']['create_fn']['fogapp_locations']
                if 'update_fn' in item['status']:
                    current_clusters = item['status']['update_fn']['fogapp_locations']
                elif 'create_fn' in item['status']:
                    current_clusters = item['status']['create_fn']['fogapp_locations']

    return current_clusters, original_clusters
