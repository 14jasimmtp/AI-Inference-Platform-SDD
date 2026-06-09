#!/bin/bash
set -euo pipefail

# Start the backend FastAPI dev server
# Ensure required environment variables are set or have defaults in .env
export ENVIRONMENT="development"
export LOG_LEVEL="INFO"
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=4

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

# Start uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
