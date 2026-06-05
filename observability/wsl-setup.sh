#!/usr/bin/env bash
# ============================================================
# One-time WSL setup: enables Docker userland-proxy and
# restarts the full observability + platform stack.
# Run this from inside a WSL terminal (DO NOT run with sudo).
# ============================================================

set -e

echo "[1/3] Writing Docker daemon config (enables userland-proxy)..."
echo '{"userland-proxy": true, "ip": "0.0.0.0"}' | sudo tee /etc/docker/daemon.json

echo "[2/3] Restarting Docker daemon..."
sudo service docker restart
sleep 3

echo "[3/3] Restarting all Docker Compose services..."
cd /mnt/c/Users/MuhamedJasim/AI-Inference-Platform-SDD
docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml down
docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml up -d

echo ""
echo "Done! Services should now be accessible at:"
echo "  http://localhost:3000  — Frontend"
echo "  http://localhost:8000  — Backend API"
echo "  http://localhost:9090  — Prometheus"
echo "  http://localhost:3001  — Grafana (admin/admin)"
echo "  http://localhost:3100  — Loki"
