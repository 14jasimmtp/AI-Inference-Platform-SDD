#!/bin/bash
echo "Syncing files to /tmp/docker-build..."
rm -rf /tmp/docker-build
mkdir -p /tmp/docker-build/backend /tmp/docker-build/frontend

# Use rsync to copy fast, ignoring big folders
rsync -a --exclude='.venv' --exclude='.venv-linux' --exclude='node_modules' --exclude='__pycache__' --exclude='.git' backend/ /tmp/docker-build/backend/
rsync -a --exclude='node_modules' --exclude='.git' frontend/ /tmp/docker-build/frontend/

eval $(minikube docker-env)

echo "Building backend..."
cd /tmp/docker-build/backend
docker build -t ai-inference-platform-sdd-api-backend:latest .

echo "Building frontend..."
cd /tmp/docker-build/frontend
docker build -t ai-inference-frontend:latest .

echo "Done!"
