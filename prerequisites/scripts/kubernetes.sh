#!/bin/bash

function install_prerequirements() {
    swapoff -a
    sudo apt-get install ebtables ethtool
    sudo apt-get update -y
    #Install docker

    sudo apt-get install -y docker.io
    sudo docker version
    cat <<EOF > /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF
    systemctl restart docker
    sudo apt-get install -y curl 
}

function install_kubeadm() {
    K8S_VERSION=1.23.3-00
    sudo apt-get update && sudo apt-get install -y apt-transport-https
    sudo curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - 
    add-apt-repository "deb https://apt.kubernetes.io/ kubernetes-xenial main"
    sudo apt-get update -y
    echo "Installing Kubernetes Packages ..."
    sudo apt-get install -y kubelet=${K8S_VERSION} kubeadm=${K8S_VERSION} kubectl=${K8S_VERSION}
    cat << EOF | sudo tee -a /etc/default/kubelet
EOF
    sudo apt-mark hold kubelet kubeadm kubectl
}

function init_kubeadm() {
    sudo swapoff -a
    sudo sed -i.bak '/.*none.*swap/s/^\(.*\)$/#\1/g' /etc/fstab
    cat <<EOF > /tmp/kubeadm-init-args.conf
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
apiServer:
  extraArgs:
    service-node-port-range: 80-32767
networking:
  podSubnet: $POD_CIDR
---
kind: KubeletConfiguration
apiVersion: kubelet.config.k8s.io/v1beta1
cgroupDriver: systemd
EOF
    sudo kubeadm init --config /tmp/kubeadm-init-args.conf
    sleep 5
}

function kube_config_dir() {
    K8S_MANIFEST_DIR="/etc/kubernetes/manifests"
    mkdir -p $HOME/.kube
    sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
    sudo chown $(id -u):$(id -g) $HOME/.kube/config
}

function install_helm() {
    HELM_VERSION="v3.7.2"
    if ! [[ "$(helm version --short 2>/dev/null)" =~ ^v3.* ]]; then
        # Helm is not installed. Install helm
        echo "Helm3 is not installed, installing ..."
        curl https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz --output helm-${HELM_VERSION}.tar.gz
        tar -zxvf helm-${HELM_VERSION}.tar.gz
        sudo mv linux-amd64/helm /usr/local/bin/helm
        rm -r linux-amd64
        rm helm-${HELM_VERSION}.tar.gz
    else
        echo "Helm3 is already installed. Skipping installation..."
    fi
}

function install_k8s_storageclass() {
    echo "Installing open-iscsi"
    sudo apt-get update -y
    sudo apt-get install open-iscsi -y
    sudo systemctl enable --now iscsid
    OPENEBS_VERSION="3.1.0"
    echo "Installing OpenEBS"
    helm repo add openebs https://openebs.github.io/charts
    helm repo update
    helm install --create-namespace --namespace openebs openebs openebs/openebs --version ${OPENEBS_VERSION}
    helm ls -n openebs
    local storageclass_timeout=400
    local counter=0
    local storageclass_ready=""
    echo "Waiting for storageclass"
    while (( counter < storageclass_timeout ))
    do
        kubectl get storageclass openebs-hostpath &> /dev/null

        if [ $? -eq 0 ] ; then
            echo "Storageclass available"
            storageclass_ready="y"
            break
        else
            counter=$((counter + 15))
            sleep 15
        fi
    done
    [ -n "$storageclass_ready" ] || FATAL "Storageclass not ready after $storageclass_timeout seconds. Cannot install openebs"
    kubectl patch storageclass openebs-hostpath -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
}

function taint_master_node() {
    K8S_MASTER=$(kubectl get nodes | awk '$3~/master/'| awk '{print $1}')
    kubectl taint node $K8S_MASTER node-role.kubernetes.io/master-
    sleep 5
}

function install_prometheus(){
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    kubectl create ns monitoring; 
    helm install prometheus-community/kube-prometheus-stack --generate-name --set grafana.service.type=NodePort --set prometheus.service.type=NodePort --set prometheus.prometheusSpec.scrapeInterval="5s" --namespace monitoring
    # helm install pud assist-public-repo/performanceandusagediagnosis --set server.service.ports.server.nodePort="30090" --set server.global.scrape_interval="5s" --set prometheusesadapter.enabled=false  --set targetapi.enabled=false  --set server.image.tag="v2.47.1" --namespace monitoring
}

function install_cilium(){
    CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/master/stable.txt)
    CLI_ARCH=amd64
    if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
    curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
    sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
    sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
    rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}

    cilium install --helm-set-string ipam.operator.clusterPoolIPv4PodCIDRList=$POD_CIDR
    cilium clustermesh enable --service-type NodePort
}

function install_flannel(){
    kubectl create ns kube-flannel
    kubectl label --overwrite ns kube-flannel pod-security.kubernetes.io/enforce=privileged

    helm repo add flannel https://flannel-io.github.io/flannel/
    helm install flannel --set podCidr=$POD_CIDR --namespace kube-flannel flannel/flannel
}

function install_api(){
    sudo mkdir -p /home/.kube
    sudo cp -i /etc/kubernetes/admin.conf /home/.kube/config
    sudo chown $(id -u):$(id -g) $HOME/.kube/config

    sudo mkdir -p /mnt/data
    sudo touch /mnt/data/targets.json

    helm repo add assist-public-repo https://gitlab.assist-iot.eu/api/v4/projects/85/packages/helm/stable
    kubectl create ns asdo
    helm install smart assist-public-repo/smartorchestrator --namespace asdo --set tags.pilot=true
}

function install_dashboard(){
    helm install dashboard assist-public-repo/manageability-dashboard --set api.envVars.smartOrchestratorApiUrl="http://smart-smartorchestrator-apigateway:8080" -n asdo
}

function usage() {         
    echo
    echo "usage: $0 [-t types]"
    echo "Must run as root"
    echo "options:"
    echo "  -t      Type of Kubernetes' component (AGENT or SERVER)"
    echo "  -p      Pod CIDR Network (Only SERVER Mode)"
    echo "  -s      Install only the Smart Orchestrator"
    echo "  -c      Install CNI cilium"
    echo "  -f      Install CNI flannel"
    exit 1
}

function exit_abnormal() {
  usage
  exit 1
}

smart=false
cilium=false
flannel=false
pool=false

while getopts "t:p:scf" options; do

  case "${options}" in
    t)
      KUBETYPE=${OPTARG}
      if [ "$KUBETYPE" != "AGENT" ] && [ "$KUBETYPE" != "SERVER" ]; then
        echo "Error: TYPE must be SERVER or AGENT"
        exit_abnormal
        exit 1
      fi
      ;;
    p)  
      pool=true
      POD_CIDR=${OPTARG}
      ;;
    s)
      smart=true
      ;;
    c)
      cilium=true
      ;;
    f)
      flannel=true
      ;;  
    :)
      echo "Error: -${OPTARG} requires an argument."
      exit_abnormal               
      ;;
    *)    
      exit_abnormal
      ;;
  esac
done

if [ "$EUID" -ne 0 ]; then
  echo "Must run as sudo";
  exit_abnormal
fi

#No options were passed to the script
if [ $OPTIND -eq 1 ]; then 
    echo "No options were passed";
    exit_abnormal
fi

# Verificar si ambos flags están activados
if [ "$cilium" = true ] && [ "$flannel" = true ]; then
  echo "You cannot provide both flags -c and -f at the same time."
  exit 1
fi

# Verificar si al menos uno de los dos flags está presente
if [ "$cilium" = false ] && [ "$flannel" = false ]; then
  echo "You must provide at least one of the flags -c or -f."
  exit 1
fi

if [ "$pool" = false ]; then
    echo "You need to provide a subnet."
    exit 1
fi
#Depending on the type, the installation changes
if [ "$KUBETYPE" == "AGENT" ]; then
    install_prerequirements
    install_kubeadm
else
    install_prerequirements
    install_kubeadm
    init_kubeadm
    kube_config_dir
    taint_master_node
    install_helm
    install_k8s_storageclass
    if $cilium; then
        install_cilium
    fi
    if $flannel; then
        install_flannel
    fi
    install_prometheus
    if $smart; then
        install_api
        install_dashboard
    fi
fi
