<div align="center">
    <img alt="Fiber" height="90" src="https://user-images.githubusercontent.com/100677511/170439941-58810f43-b437-41e5-9976-899b60cf1e5e.png">
  <br>

</div>
<p align="center">
  <b>The Smart Orchestrator</b> simplifies how user interfaces and other enablers interact with the primary components of the <a href="https://osm.etsi.org/">MANO framework</a> and  <a href="https://kubernetes.io/es/">Kubernetes</a> clusters. This <b>enabler</b> manages the complete <b>lifecycle</b> of Containerized Functions, whether they are network-related or not, from their creation to their termination, enabling deployment on any available k8s cluster.
</p>

[![Technologies](https://skills.thijs.gg/icons?i=nodejs,mongodb,kubernetes,docker,ts,prometheus,py&theme=light)](https://skills.thijs.gg)

## ⚡️ Features
The Smart Orchestrator has the goal of deploying, monitoring, and orchestrating resources that have been instantiated in each of the Kubernetes clusters that have been added to it. To achieve these objectives, the enabler relies on four different technologies: <b>API REST</b>, <b>Prometheus</b>, <b>MongoDB</b>, and <b>mck8s</b>. The Smart Orchestrator includes the following main features:

-   <b>Decision intelligence</b>: The Smart Orchestrator offers Kubernetes decision intelligence by accessing the metrics servers in the other joined clusters to determine the optimal placement of enablers based on the resources available in each cluster.
-   <b>Lifecycle control</b>: The Smart Orchestrator provides lifecycle control, enabling the management of enablers from their deployment to their deletion.


## 🧬 Place in architecture

The Smart Orchestrator is part of the <b>Smart Network and Control plane</b> in the ASSIST-IoT architecture. It provides an <b>intelligent</b> and <b>dynamic</b> network infrastructure where nodes work in parallel and communicate seamlessly. The Smart Orchestrator monitors enablers and schedules them efficiently based on CPU and memory resources.

The enabler is composed of these elements:

-   <b>API REST</b>: The entry point for user interaction and responsible for communication with other components to obtain, add, or delete resources such as enablers, clusters, or repositories.
-   <b>Orchestrator</b>: Controls the entire lifecycle of Containerized Network Functions (CNFs), from their instantiation to their termination, allowing deployment in any available k8s cluster.
-   <b>Metrics server</b>: Collects performance metrics from targets (Kubernetes clusters).
-   <b>Scheduler</b>: Provides logic to place enablers based on resources available in the joined Kubernetes clusters.
-   <b>Multiservice controller</b>: Allows the connectivity from edge services to cloud services based in name service.

<div align="center">
  <img src="images/smart_orchestrator-architecture.png" />
</div>

## ⚠️ Pre-requisites
* <b>MINIMUM</b>: 2 CPUs, 6 GB RAM, 40GB disk and a single interface with Internet access1.16 to 1.20.
* <b>RECOMMENDED</b>: 2 CPUs, 8 GB RAM, 40GB disk and a single interface with Internet access.
* <b>Base image</b>: Ubuntu 20.04 (64-bit variant required).

## ⚙️ Installation K8s cluster & Smart Orchestrator

### 📖 KUBEADM
 Install a K8s cluster located in the edge tier of the architecture using Kubeadm.

    1. git clone https://gitlab.assist-iot.eu/enablers-registry/public.git
    2. cd public/
    3. cd smartorchestrator/
    4. cd scripts/
    5. chmod +x kubernetes.sh
  

> ⚠️**Warning**
> - ENSURE THAT ALL NODES ARE ADDED TO THE MAIN CLUSTER (MASTER NODE) PRIOR TO ADDING THE CLUSTER TO THE SMARTORCHESTRATOR.

### Master node & Smart Orchestrator
Install a K8s cluster with a master node and the Smart Orchestrator.

👁️‍🗨️ There are three important flags:
 -   <b>t</b>: SERVER or AGENT (in this case SERVER).
 -   <b>p</b>: Pod CIDR Network (This MUST be different in each cluster. If you choose 10.216.0.0/16, the other cluster MUST be for instance 10.215.0.0/16).
 -   <b>s</b>: Install or not the smart orchestrator.
 -   <b>c</b>/<b>f</b>: Install cilium (-c) or flannel (-f).

> ⚠️**Warning**
> - DO NOT REPEAT POD CIDR NETWORK.

```bash
sudo ./kubernetes.sh -t SERVER -p 10.216.0.0/16 -s -c
```
### Master node without Smart Orchestrator
Install a K8s cluster with a master node.

👁️‍🗨️ There are three important flags:
 -   <b>t</b>: SERVER or AGENT (in this case SERVER).
 -   <b>p</b>: Pod CIDR Network (This MUST be different in each cluster. If you choose 10.216.0.0/16, the other cluster MUST be for instance 10.215.0.0/16).
 -   <b>c</b>/<b>f</b>: Install cilium (-c) or flannel (-f).

> ⚠️**Warning**
> - DO NOT REPEAT POD CIDR NETWORK.

```bash
sudo ./kubernetes.sh -t SERVER -p 10.216.0.0/16 -c
```

### Worker node
Install a K8s worker node to add to an existing master node.

```bash
sudo ./kubernetes.sh -t AGENT
```

Once the worker node is ready, switch to the main cluster (master node) and copy the output of this command:

```bash
kubeadm token create --print-join-command
```

 Switch again to the agent node of the cluster and paste the command output as *sudo*.
> **Note**
> - A KUBEADM node can not be joined to a k3s cluster.
> - A k3s node can not be joined to a KUBEADM cluster.


### 📖 K3S
Install a K3s (a lightweight K8s distribution) cluster located in the edge tier of the architecture

    1. git clone https://gitlab.assist-iot.eu/enablers-registry/public.git
    2. cd public/
    3. cd smartorchestrator/
    4. cd scripts/
    5. chmod +x k3s.sh

> ⚠️**Warning**
> - ENSURE THAT ALL NODES ARE ADDED TO THE MAIN CLUSTER (MASTER NODE) PRIOR TO ADDING THE CLUSTER TO THE SMARTORCHESTRATOR.

### Raspberry Pi Setup  [![Raspberry](https://skillicons.dev/icons?i=raspberrypi&theme=light)](https://skillicons.dev)

If the selected hardware for the edge device is Raspberry Pi 4, it is imperative to consider the distinct requirements necessary for the proper functioning of the involved software. These requirements include:

  1. The OS must be **Ubuntu Server 22.04.2 LTS (64-bit)**. The easiest way to install it is using the software **Raspberry Pi Imager**.
  2. Upon installation of the OS, access to the files on the SD card and make modifications to the */boot/firmware/cmdline.txt* file by adding the following at the end of the line:
  ```bash
    cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory
  ```
  3. Install the package *linux-modules-extra-raspi*
  ```bash
    sudo apt-get update
    sudo apt-get install linux-modules-extra-raspi
  ```

### Master node
Install a K8s cluster with a master node.

👁️‍🗨️ There are three important flags:
 -   <b>t</b>: SERVER or AGENT (in this case SERVER).
 -   <b>i</b>: Server IP. If the edge is behind a NAT and the Smart Orchestrator or the worker nodes are outside, the value is your Public IP.
 -   <b>p</b>: Pod CIDR Network (This MUST be different in each cluster. If you choose 10.216.0.0/16, the other cluster MUST be for instance 10.215.0.0/16).
 -   <b>c</b>/<b>f</b>: Install cilium (-c) or flannel (-f).

> ⚠️**Warning**
> - DO NOT REPEAT POD CIDR NETWORK.
> - 10.217.0.0/16 IS RESERVED FOR THE SMART ORCHESTRATOR CLUSTER.


```bash
sudo ./k3s.sh -t SERVER -i serverIP -p 10.213.0.0/16 -c
```

### Worker node
Install a K8s worker node to add an existing master node.

👁️‍🗨️ There are three important flags:
 -   <b>s</b>: Server IP (Master Node IP).
 -   <b>k</b>: The server token can be found on the master node machine, located at the following path:
*/var/lib/rancher/k3s/server/node-token*

```bash
sudo ./k3s.sh -t AGENT -i serverIP -k serverToken
```

> **Note**
> - K8s clusters cannot mix nodes from different K8s distributions (kubeadm, K3s, ...) , all the nodes of a cluster must belong to the same distribution.
> - A KUBEADM node can not be joined to a k3s cluster.
> - A k3s node can not be joined to a KUBEADM cluster.


## 💡 User Guide

The enabler has a management API with a REST interface that allows you to configure certain values. The API will respond with the requested information or the result of the command you executed.



Method  |   Endpoint                        |   Description                 |   Payload                                                                                |   Information
--------|-----------------------------------|-------------------------------|------------------------------------------------------------------------------------------|------------------
GET     | /clusters                         | Return K8s clusters           |                                                                                          |
GET	    | /clusters/:clusterid  | Get k8s cluster by id	    |
GET	    | /clusters/node/:clusterid  | Get nodes by k8s cluster	    |
GET	    | /clusters/cloud/find        | Get cluster cloud	    |
POST    | /clusters                         | Add a K8s cluster             | {"name": String, "description": String, "credentials": Object,	"cloud": String, "cni": String}   |
DELETE  | /clusters/:id                     | Delete a k8s cluster by id        |                                                                                          |
GET     | /repos                  | Return the helm repositories           |                                                                                          |
GET     | /repos/charts/:repositoryId                  | Return the charts in a helm repository          |                                                                                          |
POST    | /repos/public                 | Add a public helm repository              | {"name": String, "description": String, "url": String}                                   |
POST    | /repos/private               | Add a private helm repository              | {"name": String, "description": String, "url": String, "auth":{ "username": String, "password":String}}                                   |
POST    | /repos/update                 | Update helm repositories              |                           |
DELETE  | /repos/:id                | Delete a helm repository by id     |                                                                                          |
GET     | /enabler            | Return the instanced enablers |                                                                                          |
POST    | /enabler                     | Instantiate an enabler        | {"name": String,"helmChart": String, "values": Object,"cluster": String,"version": String,"timeout": String,"auto": Boolean,"placementPolicy": String} | The placementPolicy can be: worst-fit, best-fit or traffic-most
POST    | /enabler/upgrade/:enablerId       | Upgrade an enabler by id    |  {"values": Object, "version": String, "timeout": String}                                                                                        |
DELETE  | /enabler/:id                  | Delete an enabler by id       | 
GET     | /enabler/cluster/:clusterId  | Get enablers in a cluster by cluster name       | 
DELETE  | /enabler/volumes/:enableId               | Delete PV and PVC related with an enabler by enabler id | 
GET     | /version  | Get Enabler Version       | 
GET     | /api-export  | Get Enabler OpenAPI       | 


[![Download Postman collection](https://custom-icon-badges.herokuapp.com/badge/-Download_Postman_Collection-orange?style=for-the-badge&logo=download&logoColor=white "Download Postman Collection")](documentation/Smart-orchestrator_microservices.postman_collection.json)



## 🖥️ User Interface

You can access the manageability enabler by utilizing the URL <b>http://your_host:30280/assistiot</b>. For more information access our [Read The Docs](https://assist-iot-enablers-documentation.readthedocs.io/en/latest/verticals/manageability/registration_and_status_enabler.html).

## 🎯 Troubleshooting

### Kubectl error
#### KUBEADM

  1. The connection to the server localhost:8080 was refused - did you specify the right host or port?
  2. Unable to connect to the server: x509: certificate signed by unknown authority

Please use this command:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

#### K3S

Please use this command:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```
### Reset kubernetes

#### KUBEADM
For reseting a kubernetes kubeadm cluster:

```bash
sudo kubeadm reset
```
#### K3s
For reseting a kubernetes k3s server node:

```bash
/usr/local/bin/k3s-uninstall.sh
```

For reseting a k3s agent node:
```bash
/usr/local/bin/k3s-agent-uninstall.sh
```

## 💻 Developer Guide

Once the code is made public, best practices for maintaining the code in all aspects will be promoted. The maintenance team will be responsible for accepting or rejecting updates. For any questions, contact with @framabio.

## ⚡ Version control and release

Version 4.0.0. New features:

-   Microservices Architecture.
-   Repositories Update.
-   Private respositories.
-   Upgrade Enablers.
-   Auto-Clustermesh
-   MultiCluster Service Controller 

## ⚠️ License

Apache 2.0