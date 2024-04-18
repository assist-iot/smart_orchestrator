#!/bin/bash

function install_cilium() {
    # Check the node architecture (arm64 or amd64)
    CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/master/stable.txt)
    CLI_ARCH=amd64
    if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
    curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
    sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
    sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
    rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}

    cilium install --helm-set-string ipam.operator.clusterPoolIPv4PodCIDRList=$POD_CIDR --helm-set-string k8sServiceHost=$SERVER_IP
    cilium clustermesh enable --service-type NodePort
}

function install_helm() {
    # sudo snap install helm --classic
    curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
    chmod 700 get_helm.sh
    ./get_helm.sh
}

function install_k3s_agent() {
    curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.28.3+k3s2" K3S_URL="https://$SERVER_IP:6443" K3S_TOKEN=$SERVER_TOKEN sh -
}

function install_k3s_server() {
    curl -sfL https://get.k3s.io |  INSTALL_K3S_VERSION="v1.28.3+k3s2" sh -s - server --flannel-backend=none --disable-network-policy --cluster-init --token 43r0s --tls-san $SERVER_IP --node-external-ip $SERVER_IP --cluster-cidr $POD_CIDR
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    # TODO --write-kubeconfig-mode "0644"
}

function restart_cilium_unmanaged_pods() {
    kubectl get pods --all-namespaces -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,HOSTNETWORK:.spec.hostNetwork --no-headers=true | grep '<none>' | awk '{print "-n "$1" "$2}' | xargs -L 1 -r kubectl delete pod
}

function install_flannel(){
    kubectl create ns kube-flannel
    kubectl label --overwrite ns kube-flannel pod-security.kubernetes.io/enforce=privileged

    helm repo add flannel https://flannel-io.github.io/flannel/
    helm install flannel --set podCidr=$POD_CIDR --namespace kube-flannel flannel/flannel
}


# Function: Print a help message.
function usage() {
    echo
    echo "usage: $0 [-t types]"
    echo "Server mode must run as root"
    echo "options:"
    echo "  -h          Prints this information"
    echo "  -c          Install Cilium"
    echo "  -f          Install Flannel"
    echo "  -t          Type of K3s' component (AGENT , SERVER or DYNAMIC SERVER)"
    echo "  -i          (Server and Agent mode) K3s server machine IP"
    echo "  -p          (Only in Server mode) K3s server POD CIDR"
    echo "  -k          (Only in Agent mode) K3s server token"
    exit 1
}

# Function: Exit with error.
function exit_abnormal() {
  usage
  exit 1
}
cilium=false
flannel=false
pool=false
serverip=false

while getopts "t:cfdi:k:p:h:" options; do

  case "${options}" in
    t)
      K3STYPE=${OPTARG}
      if [ "$K3STYPE" != "AGENT" ] && [ "$K3STYPE" != "SERVER" ] && [ "$K3STYPE" != "DYNAMIC-SERVER" ]; then
        echo "Error: TYPE must be AGENT , SERVER or DYNAMIC SERVER"
        exit_abnormal
        exit 1
      fi
      ;;
    c)
      cilium=true
      ;;
    f)
      flannel=true
      ;;
    i)
      serverip=true
      SERVER_IP=${OPTARG}
      ;;
    k)
      SERVER_TOKEN=${OPTARG}
      ;;
    p)
      pool=true
      POD_CIDR=${OPTARG}
      ;;
    h)
      usage
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
if [ "$K3STYPE" == "SERVER" ] && [ "$cilium" = false ] && [ "$flannel" = false ]; then
  echo "You must provide at least one of the flags -c or -f."
  exit 1
fi

if [ "$K3STYPE" == "SERVER" ] && [ "$pool" = false ]; then
    echo "You need to provide a subnet (-p)."
    exit 1
fi

if  [ "$serverip" = false ]; then
    echo "You need to the server IP (-i)."
    exit 1
fi

#Depending on the type, the installation changes
if [ "$K3STYPE" == "AGENT" ]; then
    install_k3s_agent
elif [ "$K3STYPE" == "SERVER" ]; then
    install_k3s_server
    install_helm
    if $cilium; then
        install_cilium
    fi
    if $flannel; then
        install_flannel
    fi
fi
