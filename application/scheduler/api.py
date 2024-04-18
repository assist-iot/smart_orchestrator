from flask import Flask, request
from utils import getFogAppLocations,normalizeData, getMetrics

app = Flask(__name__)


@app.route('/scheduler', methods = ['POST'])
def scheduler():
    try:
        
        helmChart = request.json['helmChart']
        placement_policy = request.json['placement_policy'] 
        values = request.json['values'] 

        fogapp_data = getMetrics(helmChart,placement_policy,values)
        if "msg" in fogapp_data: raise Exception (fogapp_data)
        
        fogapp_replicas=fogapp_data['replicas']
        fogapp_placement_policy=fogapp_data['placement_policy']
        print(fogapp_replicas)
        fogapp_cpu_request,fogapp_memory_request = normalizeData(fogapp_data['cpu'],fogapp_data['memory'])

        if not fogapp_replicas:
            print(f"Number of replicas must be set. Got {fogapp_replicas}.")

        # Placement policy specified by user
        if fogapp_placement_policy != "":
            placement_policy = fogapp_placement_policy
        else: # Default placement policy is most_traffic
            placement_policy = 'most_traffic'

        clusters_qty = 1

        eligible_clusters = []

        mode = 'create'
        fogapp_locations = getFogAppLocations(fogapp_cpu_request, fogapp_memory_request, fogapp_replicas, clusters_qty, placement_policy, mode, fogapp_replicas)

        if len(fogapp_locations) != 0:
            eligible_clusters = []
            for cluster in fogapp_locations:
                if cluster['max_replicas'] >= fogapp_replicas:
                    cluster['replicas'] = fogapp_replicas
                    eligible_clusters.append(cluster)
                else:
                    cluster['replicas'] = cluster['max_replicas']
                    cluster['overflow'] = fogapp_replicas - cluster['max_replicas']
                    if cluster['overflow'] > 0:
                        continue

        if len(eligible_clusters) != 0:
            temp_list=[eligible_clusters[0]]
        else:
            temp_list=eligible_clusters

        print(temp_list)
    except:
        return fogapp_data
    else:
        return temp_list

app.run( host='0.0.0.0' )
