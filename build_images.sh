#!/bin/bash
eval $(minikube docker-env)
cd backend
echo "Building backend..."
docker build -t ai-inference-platform-sdd-api-backend:latest .
cd ../frontend
echo "Building frontend..."
docker build -t ai-inference-frontend:latest .
echo "Done."
