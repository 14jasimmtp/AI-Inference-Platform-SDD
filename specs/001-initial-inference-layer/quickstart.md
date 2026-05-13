# Quickstart: Initial Inference Layer

## Prerequisites
- **Ollama**: Installed natively on the host.
- **Model**: Pull the required model: `ollama pull llama3.2:3b-instruct-q4_K_M`
- **Docker & Docker Compose**: Installed and running.

## Local Development Setup

1. **Clone the repository** (if not already done).
2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Update JWT_SECRET and other variables if necessary
   ```
3. **Start the Infrastructure**:
   ```bash
   docker compose up -d postgres-db redis-cache
   ```
4. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   # Run migrations
   alembic upgrade head
   # Start the app
   uvicorn app.main:app --reload
   ```
5. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Verification Steps

### 1. Register and Login
Open the UI at `http://localhost:3000` (via Traefik or direct dev port) and create an account.

### 2. Create API Key
Navigate to the "API Keys" section in the UI and generate a new key. **Copy the plaintext key.**

### 3. Test Inference via CLI
```bash
curl -X POST http://localhost/api/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b-instruct-q4_K_M",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

### 4. Test Chat UI
Go to the chat page, select the model, and send a message. Verify that tokens stream in (if using stream: true).

## Monitoring
- **Prometheus**: `http://localhost:9090` (Internal access)
- **Grafana**: `http://localhost/grafana` (Login with default creds)
- **Traefik Dashboard**: Accessible on the internal admin port.
