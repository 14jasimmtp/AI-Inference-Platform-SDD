# Kubernetes Deployment Guide (Local Environment)

This directory contains the Kubernetes manifests required to run the **AI Inference Platform** on a local cluster (e.g., Docker Desktop, Minikube, or Kind).

---

## 🛠️ Prerequisites

Before you begin, ensure you have:
1. **kubectl** command-line tool installed.
2. A local Kubernetes cluster running:
   - **Docker Desktop** (with Kubernetes enabled in settings) — *Recommended for Windows users*
   - **Minikube** (`minikube start`)
   - **Kind** (`kind create cluster`)

---

## 📦 Step 1: Build Docker Images Locally

Since these manifests target local images (`imagePullPolicy: IfNotPresent`), you must build the backend and frontend Docker images on your machine and make them visible to your Kubernetes cluster.

### A. Using Docker Desktop
If you are using Docker Desktop's built-in Kubernetes cluster, your local Docker daemon is shared with Kubernetes. Simply run these commands from the repository root:

```bash
# Build the backend image
docker build -t ai-inference-backend:latest ./backend

# Build the frontend image
docker build -t ai-inference-frontend:latest ./frontend
```

### B. Using Minikube
If you are using Minikube, you must point your terminal's shell to Minikube's Docker daemon before building the images:

```bash
# Point shell to Minikube's Docker daemon
minikube docker-env | Invoke-Expression   # PowerShell
# OR: eval $(minikube -p minikube docker-env) # Git Bash/WSL

# Build the images
docker build -t ai-inference-backend:latest ./backend
docker build -t ai-inference-frontend:latest ./frontend
```

---

## 🚀 Step 2: Deploy to Kubernetes

Deploy all resources in the correct dependency order. From the `kubernetes/` directory, run:

```bash
# 1. Create the dedicated namespace
kubectl apply -f namespace.yaml

# 2. Apply shared configuration and credentials
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml

# 3. Deploy the database and cache layers
kubectl apply -f postgres-service.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f redis-service.yaml
kubectl apply -f redis-deployment.yaml

# 4. Deploy the application services
kubectl apply -f backend-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f frontend-deployment.yaml
```

*Alternative (all-in-one apply):*
```bash
kubectl apply -f namespace.yaml
kubectl apply -f .
```

---

## 🔍 Step 3: Verify the Deployment

Check the status of your workloads inside the `ai-platform` namespace:

```bash
# Watch the pod startup lifecycle
kubectl get pods -n ai-platform -w
```

You should see all pods transition to `Running` status:
```text
NAME                        READY   STATUS    RESTARTS   AGE
postgres-0                  1/1     Running   0          45s
redis-7f9b8c6d4-abcde       1/1     Running   0          40s
backend-6c9f745f4-fghij     1/1     Running   0          30s
frontend-8f5c93d7c-klmno    1/1     Running   0          25s
```

---

## 🔌 Step 4: Access the Application

Since we are running locally without an Ingress controller, we will use Kubernetes port-forwarding. Keep these commands running in your terminal to map cluster services to your local machine:

```bash
# Port-forward the Frontend (Port 3000)
kubectl port-forward svc/frontend-service 3000:3000 -n ai-platform

# Port-forward the Backend API (Port 8000)
# (Run in a separate terminal)
kubectl port-forward svc/backend-service 8000:8000 -n ai-platform
```

Now, open your browser and navigate to:
* **Frontend UI Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧠 Connecting Backend to Host Ollama

The backend is configured to connect to Ollama using `OLLAMA_BASE_URL` defined in `configmap.yaml` as `http://host.docker.internal:11434`.

Depending on your local Kubernetes setup:
1. **Docker Desktop**: `host.docker.internal` should resolve out-of-the-box.
2. **Minikube**: You can map `host.docker.internal` to the Minikube host gateway (`10.0.2.2`). In `backend-deployment.yaml`, we've included a commented `hostAliases` block. Uncomment it and set the IP to `10.0.2.2` (or your host IP).
3. **Alternative**: Edit `configmap.yaml` and set `OLLAMA_BASE_URL` directly to your local computer's primary LAN IP address (e.g., `http://192.168.1.50:11434`), then recreate the configmap:
   ```bash
   kubectl apply -f configmap.yaml
   kubectl rollout restart deployment/backend -n ai-platform
   ```

> ⚠️ **Important Ollama Note**: Ensure Ollama is configured to listen on all interfaces on your host machine by setting the environment variable `OLLAMA_HOST=0.0.0.0` before launching the Ollama desktop app.

---

## 🧹 Cleaning Up

To delete the deployment and wipe out all local Kubernetes resources:

```bash
kubectl delete namespace ai-platform
```
*(This will automatically tear down all pods, deployments, services, secrets, and the Postgres storage volume).*
