---
title: Kubernetes from scratch
Summary: Basic setup for a development kubernetes cluster explained
date: "2028-05-23"
---

# Intro
In this post I am going to explain some basics about kubernetes and setting it up.
For this purpose I will use `kubeadm`, `kubectl` and `kubelet`. As this approach provides a more realistic production environment.
There's this fancy `microk8s` trend now, but IMHO it's really simplistic.

## Prerequisites
- Pre existing (minimum 2cpu) instance from any cloud provider or even own machine.
- `kubectl`, `kubeadm` and `kubelet` installed
- A container runtime (I have `containerd` as /var/run/containerd/containerd.sock is present :smile: ) 
- At least one cgroup driver like `cgroupfs` or `systemd`. Usually systemd comes as the init system of ubuntu/debian distros, you can check that with `ps -p 1 -o comm=`. In my case I use systemd.
- (Optional) - [Configure a cgroup driver](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)

Details:  
kubeadm: the command to bootstrap the cluster.  
kubelet: the component that runs on all of the machines in your cluster and does things like starting pods and containers.  
kubectl: the command line util to talk to your cluster.  


## Hands on!
The main goal is to initialize a cluster, with `kubeadm init` the following happens:

![kubeadm_arch](kubeadm_arch.png)

1. When you initialize kubeadm, first it runs all the preflight checks to validate the system state and it downloads all the required cluster container images from the **registry.k8s.io** container registry.
2. It then generates required TLS certificates and stores them in the **/etc/kubernetes/pki** folder.
3. Next, it generates all the kubeconfig files for the cluster components in the **/etc/kubernetes** folder.
4. Then it starts the kubelet service and generates the static pod manifests for all the cluster components and saves it in the **/etc/kubernetes/manifests** folder.
5. Next, it starts all the control plane components from the static pod manifests.
6. Then it installs core DNS and Kubeproxy components
7. Finally, it generates the node bootstrap token.
8. Worker nodes use this token to join the control plane.

