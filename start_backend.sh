#!/bin/bash
# Start the backend FastAPI dev server
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5433/inference_platform"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET="dev-secret-change-in-prod"
export OLLAMA_BASE_URL="http://localhost:11434"
export CORS_ORIGINS="http://localhost:3000"
export ENVIRONMENT="development"
export LOG_LEVEL="INFO"

cd /mnt/c/Users/MuhamedJasim/AI-Inference-Platform-SDD/backend
/home/jasim/.local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
