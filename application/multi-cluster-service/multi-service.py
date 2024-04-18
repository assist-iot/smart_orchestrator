import kopf
# import yaml, pandas as pd
from utils import createService, deleteService, createKubeConfigAndGetEdgeClusters
import json
import time

# Create multi-cluster service
@kopf.on.create('assist.eu', 'v1', 'multiclusterservices')
def create_fn(body, spec, meta, patch, **kwargs):
# def service_create(body, spec, meta, patch, **kwargs):
    
    fogapp_name = body['metadata']['name']

    # Get namespace
    if 'namespace' in body['metadata']:
        fogpapp_namespace = body['metadata']['namespace']
    else:
        fogpapp_namespace = "default"

    spec_text = str(spec)

    # For the spec file
    if 'io.cilium/global-service' in meta['annotations']:
        service_template = "{'apiVersion': 'v1', 'kind': 'Service', 'metadata': {'annotations':{'io.cilium/global-service':'true', 'io.cilium/shared-service':'false', 'io.cilium/service-affinity': 'remote'}, 'name': '" + fogapp_name + "', 'namespace': '" + fogpapp_namespace + "'}, 'spec': "
    elif 'external-dns.alpha.kubernetes.io/internal-hostname' in meta['annotations']:
        service_template = "{'apiVersion': 'v1', 'kind': 'Service', 'metadata': {'annotations':{'external-dns.alpha.kubernetes.io/hostname':'" + fogapp_name + ".assist.apps'}, 'name': '" + fogapp_name + "', 'namespace': '" + fogpapp_namespace + "'}, 'spec': "
    else:
        service_template = "{'apiVersion': 'v1', 'kind': 'Service', 'metadata': {'name': '" + fogapp_name + "', 'namespace': '" + fogpapp_namespace + "'}, 'spec': "

    service_json = service_template + spec_text + "}"
    service_text = service_json.replace("'", "\"")
    service_body = json.loads(service_text)

    if 'locations' not in spec:
        current_cluster_added, kubeconfig = createKubeConfigAndGetEdgeClusters()
    else:
        input_clusters = spec['locations'].split(",")
        current_clusters = []
        for location in input_clusters:
            current_clusters.append(location.strip())

    for indice, cluster in enumerate(current_cluster_added):
        createService(cluster, service_body, fogpapp_namespace,kubeconfig[indice])
        print({'fogapp_name': fogapp_name, 'fogapp_namespace': fogpapp_namespace, 'fogapp_locations': current_cluster_added, 'fogapp_status': 'provisioned'})
        
    return {'fogapp_name': fogapp_name, 'fogapp_namespace': fogpapp_namespace, 'fogapp_locations': current_cluster_added, 'fogapp_status': 'provisioned'}

# Delete multi-cluster service
@kopf.on.delete('assist.eu', 'v1', 'multiclusterservices')
def delete_fn(body, spec, patch, **kwargs):
    fogapp_name = body['metadata']['name']
    # Get namespace
    if 'namespace' in body['metadata']:
        fogpapp_namespace = body['metadata']['namespace']
    else:
        fogpapp_namespace = "default"

    current_cluster_added, kubeconfig = createKubeConfigAndGetEdgeClusters()

    for indice,cluster in enumerate(current_cluster_added):
        deleteService(cluster, fogapp_name, fogpapp_namespace, kubeconfig[indice])

    msg = f"Multi Cluster Service {fogapp_name} is DELETED!"
    return {'message': msg}
