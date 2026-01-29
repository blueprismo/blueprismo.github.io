---
title: Contributing to EOL.date
Summary: A very nice web that you can contribute with some little effort.
date: "2026-01-28"
draft: false
---

# Intro

In the supply chain world, one has to be really careful when a product is reaching it's EOL state.
EOL stands for End Of Life, we feel sad when life is ending, such is a condition of living, while most of the projects have an end of life policy, some others get their releases frozen (like [ansible/awx](https://github.com/ansible/awx/tree/24.6.1)) and others decide to stop releasing and making the project a source-only distribution (like [minio/minio](https://github.com/minio/minio)).

In this example I'm going to use as an example the [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver).

## End of... what?

There are multiple "EO- alphabet soup", the most important ones are:

EOL: End of Life. The product/version is dead, won't receive updates, security fixes, bug fixes. In this state the repository is often archived or removed.

EOS: End of Support, the product/version won't have any new security fixes.

EOM: End of Maintenaince, sometimes also called End of Development, the product/version won't have any new features or development, but can provide security fixes sometimes.

It's worth mention that each product has it's own policies and it's important to take attention into detail for how it's lifecycle works. Here's a little table to sum it up:

| Term | Can you run it? | Fixes?        | Vendor help? |
| ---- | --------------- | ------------- | ------------ |
| EOM  | Yes             | Security only | Maybe        |
| EOS  | Yes             | No            | No           |
| EOL  | Yes (at risk)   | No            | No           |

## What is a Kubernetes CSI driver?

A Kubernetes CSI driver is a plugin that allows a Kubernetes cluster talk to storage systems in a standard way

That storage system could be:

- Cloud disks (AWS EBS, Azure Disk, GCE PD)
- Network storage (NFS, Ceph, GlusterFS)
- Vendor products (NetApp, Pure, Portworx, etc.)
- Local disks

The CSI driver implements a standard set of API calls to allow multiple operations on the storage systems (provisioning, attaching, mounting, resizing, snapshots, etc.)

The actual call chain in reality goes this way:

1. Pod references a PVC (Persistent Volume Claim)
2. PVC references a StorageClass
3. Kubernetes controller:
  i. Reads the StorageClass
  ii. Sees provisioner: `ebs.csi.aws.com`
4. Kubernetes calls the CSI driver
  i. `CreateVolume`
  ii. `AttachVolume`
  iii. `NodePublishVolume`

Excuse my redundancy, but I just want to make it clear that it's a component that allows EKS (and other clusters, really) to handle Amazon EBS storage automatically.

Theoretically if your cluster is outside of EC2, the authentication won't be possible with [IMDS\[v2\]](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html), but the driver can still be used as long as your nodes can authenticate to AWS.

## Does this project have an EOL?

Well, it's actually EOS, but we care about when our tools will stop receiving updates and security fixes.

Looking at the [AWS EBS CSI Driver support policy](https://github.com/kubernetes-sigs/aws-ebs-csi-driver/tree/master?tab=readme-ov-file#support), the project follows a monthly release schedule with support provided for the latest version and one prior version. This is a common pattern among most of the kubernetes components release cycle.

This means that support is provided with current + previous version (sometimes referred as `n-1`)

For example, if we have versions 1.53, 1.54, and 1.55:
- Version 1.55 (latest): ✅ Supported
- Version 1.54: ✅ Supported
- Version 1.53: ❌ End of Support

As soon as version `1.56` is released, then 1.54 will stop having support.

## Contributing to EOL.date

To contribute a new product (like the AWS EBS CSI Driver example), you need to:

1. **Fork the repository**: [endoflife.date on GitHub](https://github.com/endoflife/endoflife.date)

2. **Create a product file**: Add a new `.md` file in the `products/` directory with the product metadata and release information

3. **Follow the format**: There is a [very nice template in their webpage](https://endoflife.date/contribute#-adding-a-new-product)

4. **Test your contribution**: The project has automated checks to validate the format

Before pushing your changes, the only thing you need to check to ensure your product works is building the webpage locally.
It's a Jekyll webpage, so you will need ruby installed.

>Bear in mind that if you're using macOS, an old version of ruby comes embedded with the system, please use a tool like [rbenv](https://rbenv.org/) to install the ruby version specified in the `.ruby-version` file at the root of the repository.

After installing the specific ruby version, then you have to install the bundler, which is the dependency manager for ruby.

```bash
# In the root repo
cat .ruby-version
# 3.4.6

# Install bundler
gem install bundler

# Install dependencies
bundle install

# build the site locally
bundle exec jekyll serve --host localhost --port 4000
```

After this, you should be able to reach localhost:4000 and see your new product! You're ready to submit the PR.

In this case is this one: [https://github.com/endoflife-date/endoflife.date/pull/9369](https://github.com/endoflife-date/endoflife.date/pull/9369)

How simple, right?

## Conclusions

In supply chain security and operational excellence, knowing when your dependencies reach end-of-life is crucial for:

- **Security posture**: Unsupported versions don't receive security patches
- **Compliance**: Many frameworks require using supported software versions
- **Planning**: Teams need lead time to upgrade before support ends
- **Risk management**: Running EOL software increases operational risk

By contributing to EOL.date, you're helping the entire community track these important lifecycle events.

Thanks for reaching this point, hope you enjoyed it
