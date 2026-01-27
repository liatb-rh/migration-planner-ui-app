# Standalone OpenShift Deployment Guide

This guide provides instructions for building and deploying the Migration Planner UI in a standalone OpenShift environment.

## Prerequisites

Before proceeding, ensure you have the following:

- **OpenShift cluster**: Access to an OpenShift cluster with sufficient permissions
- **OpenShift CLI (oc)**: Installed and configured on your local machine
- **Project context**: You have switched to the required OpenShift project/namespace
- **Cluster credentials**: Properly configured authentication with your OpenShift cluster
- **Migration Planner API**: The migration-planner backend service must be deployed in the same project
  - Follow the deployment instructions: https://github.com/kubev2v/migration-planner/blob/main/doc/deployment.md

## Building and Deploying from Source

### Step 1: Build the Container Image

Build the container image locally using Podman:

```bash
# Build the container image
make podman-build IMAGE=quay.io/your-registry/migration-planner-ui
```

### Step 2: Push to Container Registry

Push the built image to your container registry:

```bash
# Login to your registry (if needed)
make quay-login QUAY_USER=your-quay-user QUAY_TOKEN=your-quay-token

# Push the image
make podman-push IMAGE=quay.io/your-registry/migration-planner-ui
```

### Step 3: Deploy to OpenShift

Deploy the application to your OpenShift cluster:

```bash
# Deploy using the OpenShift template
make deploy-on-openshift IMAGE=quay.io/your-registry/migration-planner-ui
```

### Step 4: Access the Application

Once deployed, get the route URL:

```bash
# Get the route URL
oc get route planner-ui -o jsonpath='{.spec.host}'
```

The application will be accessible at: `https://<route-host>`

## Verification

### Check Deployment Status

```bash
# Check deployment status
oc get deployment migration-planner-ui

# Check pod status
oc get pods -l app=migration-planner-ui

# Check service and route
oc get svc migration-planner-ui
oc get route planner-ui
```

### View Application Logs

```bash
# View logs from the UI pods
oc logs -l app=migration-planner-ui -f
```

## Cleanup

To remove the deployment:

```bash
# Remove using Makefile
make delete-from-openshift IMAGE=quay.io/your-registry/migration-planner-ui
```
