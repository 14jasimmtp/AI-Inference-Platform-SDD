# AI Inference Platform

A self-hosted, OpenAI-compatible AI inference platform powered by **Ollama** for local LLM execution. Built with a **FastAPI** async backend, **React** chat UI, **PostgreSQL** for persistence, and **Redis** for rate limiting — all orchestrated via **Docker Compose**.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Request Flow: Chat Completion](#request-flow-chat-completion)
- [Authentication Flow](#authentication-flow)
- [Rate Limiting with Redis](#rate-limiting-with-redis)
- [Database & Migration Flow](#database--migration-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)

---

## Architecture Overview

The platform follows a **four-tier containerized architecture** where each concern is isolated into its own Docker container, communicating over a shared bridge network (`platform-network`).

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Compose Network                       │
│                         (platform-network)                          │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────┐  ┌───────────┐ │
│  │   Frontend    │   │   Backend    │   │ Postgres │  │   Redis   │ │
│  │  React/Vite   │──▶│   FastAPI    │──▶│    DB    │  │   Cache   │ │
│  │  :3000        │   │  :8000       │──▶│  :5432   │  │   :6379   │ │
│  └──────────────┘   └──────┬───────┘   └──────────┘  └───────────┘ │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │ HTTP (host.docker.internal)
                             ▼
                      ┌──────────────┐
                      │    Ollama     │
                      │  (Host LLM)  │
                      │   :11434     │
                      └──────────────┘
```

### Component Responsibilities

| Container | Image | Role |
|---|---|---|
| **frontend** | `node:20-slim` + Vite | Serves the React chat UI on port `3000`. Communicates with the backend via REST/SSE. |
| **api-backend** | `python:3.12-slim` + FastAPI | Core API server. Handles auth, rate limiting, and proxies inference requests to Ollama. |
| **postgres-db** | `postgres:16-alpine` | Persistent storage for users, API keys, and session metadata. Managed via Alembic migrations. |
| **redis-cache** | `redis:7-alpine` | In-memory store for the token-bucket rate limiter (Lua script). |
| **Ollama** _(host)_ | N/A (runs on host) | Executes local LLM inference (e.g., Llama 3.2). Accessed by the backend via `host.docker.internal`. |

---

## System Architecture Diagram

```mermaid
graph TB
    subgraph Browser
        UI["React Chat UI<br/>(localhost:3000)"]
    end

    subgraph DockerCompose["Docker Compose (platform-network)"]
        FE["Frontend Container<br/>Vite Dev Server :3000"]
        BE["FastAPI Backend<br/>Uvicorn :8000"]
        PG["PostgreSQL 16<br/>:5432"]
        RD["Redis 7<br/>:6379"]
    end

    subgraph Host["Host Machine"]
        OL["Ollama<br/>Local LLM Engine<br/>:11434"]
    end

    UI -->|"HTTP Requests<br/>(REST + SSE)"| BE
    FE -.->|"Serves static assets"| UI
    BE -->|"asyncpg<br/>SQL Queries"| PG
    BE -->|"Lua Script<br/>Token Bucket"| RD
    BE -->|"httpx<br/>/api/chat, /api/tags"| OL

    style UI fill:#7c3aed,stroke:#5b21b6,color:#fff
    style FE fill:#06b6d4,stroke:#0891b2,color:#fff
    style BE fill:#f59e0b,stroke:#d97706,color:#fff
    style PG fill:#3b82f6,stroke:#2563eb,color:#fff
    style RD fill:#ef4444,stroke:#dc2626,color:#fff
    style OL fill:#10b981,stroke:#059669,color:#fff
```

---

## Request Flow: Chat Completion

This is the **critical path** — what happens when a user sends a message in the chat UI.

```mermaid
sequenceDiagram
    participant User as 👤 User (Browser)
    participant React as ⚛️ React Frontend
    participant FastAPI as 🐍 FastAPI Backend
    participant Redis as 🔴 Redis
    participant Ollama as 🦙 Ollama (Host)
    participant Postgres as 🐘 PostgreSQL

    User->>React: Types message & hits Send
    React->>React: Appends user message to Zustand store
    React->>FastAPI: POST /v1/chat/completions<br/>{model, messages, stream: true}<br/>Authorization: Bearer <JWT>

    Note over FastAPI: Authentication Phase
    FastAPI->>FastAPI: Decode JWT (python-jose)
    FastAPI->>Postgres: SELECT user WHERE id = jwt.sub
    Postgres-->>FastAPI: User record

    Note over FastAPI: Rate Limiting Phase
    FastAPI->>Redis: Execute Lua token-bucket script<br/>KEYS: ratelimit:{user_id}<br/>ARGV: [rpm, rate, now, ttl]
    Redis-->>FastAPI: [allowed=1, remaining, retry_after]

    Note over FastAPI: Inference Phase (Streaming)
    FastAPI->>Ollama: POST /api/chat<br/>{model, messages, stream: true}

    loop SSE Token Stream
        Ollama-->>FastAPI: {"message": {"content": "token"}, "done": false}
        FastAPI-->>React: data: {"choices": [{"delta": {"content": "token"}}]}
        React->>React: Append token to streamingContent
        React->>User: Render partial response in real-time
    end

    Ollama-->>FastAPI: {"done": true, "done_reason": "stop"}
    FastAPI-->>React: data: [DONE]
    React->>React: Commit full response to session messages
    React->>React: Persist to localStorage via Zustand
```

### Step-by-Step Breakdown

1. **User Input** → The React frontend captures the user's message and immediately appends it to the Zustand chat store for instant UI feedback.

2. **SSE Request** → The frontend sends a `POST /v1/chat/completions` with `stream: true` and reads the response as a `ReadableStream`.

3. **JWT Authentication** → The backend extracts the `Bearer` token, decodes it using `python-jose`, and looks up the user in PostgreSQL. If the token is an API key instead, it falls back to SHA-256 hash lookup.

4. **Rate Limiting** → Before forwarding to Ollama, the backend executes a **Lua script** on Redis implementing a [token-bucket algorithm](#rate-limiting-with-redis). If the bucket is empty, a `429 Too Many Requests` is returned.

5. **Ollama Proxy** → The backend opens a streaming HTTP connection to Ollama's `/api/chat` endpoint using `httpx.AsyncClient.stream()`.

6. **SSE Translation** → Each JSON chunk from Ollama is re-formatted into an OpenAI-compatible SSE event (`data: {...}\n\n`) and streamed to the frontend.

7. **Client Rendering** → The React frontend processes each SSE event, concatenates the token deltas, and renders the response progressively (typewriter effect).

8. **Persistence** → Once `[DONE]` is received, the complete assistant message is committed to the Zustand store, which auto-persists to `localStorage` via the `persist` middleware.

---

## Authentication Flow

The platform supports **dual authentication**: JWT tokens for the UI and API keys for programmatic access.

```mermaid
flowchart TD
    A["Incoming Request<br/>Authorization: Bearer <token>"] --> B{Try JWT Decode}
    B -->|"✅ Valid JWT"| C["Extract user_id from sub claim"]
    C --> D["Query PostgreSQL for User"]
    D --> E{User exists & active?}
    E -->|"✅ Yes"| F["✅ Authenticated<br/>(user, api_key=None)"]
    E -->|"❌ No"| G["❌ 401 Unauthorized"]

    B -->|"❌ JWTError"| H["Fallback: Try API Key"]
    H --> I["SHA-256 hash the raw key"]
    I --> J["Query api_keys WHERE key_hash = hash"]
    J --> K{Key found, active,<br/>not expired/revoked?}
    K -->|"✅ Yes"| L["Query User by api_key.user_id"]
    L --> F
    K -->|"❌ No"| G

    style F fill:#10b981,stroke:#059669,color:#fff
    style G fill:#ef4444,stroke:#dc2626,color:#fff
```

### Registration & Login

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Creates a new user. Password is hashed with `bcrypt`. |
| `/api/v1/auth/login` | POST | Verifies credentials, returns a signed JWT (`HS256`, 60-min expiry). |
| `/api/v1/auth/me` | GET | Returns the authenticated user's profile. |

### API Key Management

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/api-keys` | POST | Generate a new API key. The plaintext key is shown once; only a SHA-256 hash is stored. |
| `/api/v1/api-keys` | GET | List all keys for the authenticated user. |
| `/api/v1/api-keys/{id}` | DELETE | Revoke (soft-delete) a key. |

---

## Rate Limiting with Redis

The rate limiter uses a **server-side token bucket** implemented as an atomic **Lua script** executed inside Redis. This guarantees race-free, distributed rate limiting even under concurrent load.

```mermaid
flowchart LR
    subgraph Redis["Redis (in-memory)"]
        BUCKET["Hash Key: ratelimit:{user_id}<br/>• tokens: 58.3<br/>• last_refill: 1715670000.5"]
    end

    REQ["Incoming<br/>Request"] --> LUA["Lua Script<br/>(Atomic Execution)"]
    LUA --> REFILL["1. Refill tokens<br/>elapsed × (rpm ÷ 60)"]
    REFILL --> CHECK{"2. tokens ≥ 1?"}
    CHECK -->|"✅ Yes"| CONSUME["3. tokens -= 1<br/>Update HMSET<br/>Set EXPIRE TTL"]
    CONSUME --> ALLOW["✅ Request Allowed<br/>remaining: 57.3"]
    CHECK -->|"❌ No"| DENY["❌ 429 Rate Limited<br/>retry_after: 2s"]

    style ALLOW fill:#10b981,stroke:#059669,color:#fff
    style DENY fill:#ef4444,stroke:#dc2626,color:#fff
    style LUA fill:#f59e0b,stroke:#d97706,color:#fff
```

### How the Token Bucket Works

1. **Key Structure** — Each user/API key gets a Redis hash: `ratelimit:{id}` containing `tokens` (float) and `last_refill` (timestamp).

2. **Refill** — On every request, tokens are refilled based on elapsed time: `tokens = min(capacity, tokens + elapsed × rate)` where `rate = rpm / 60`.

3. **Consume** — If `tokens ≥ 1`, one token is consumed and the request proceeds. Otherwise, a `429` error is returned with a `retry_after` value.

4. **TTL** — Each bucket key has a configurable TTL (default: 120s) to auto-expire stale entries.

5. **Fail-Open** — If Redis is unreachable, the limiter degrades gracefully and allows all requests (logged as a warning).

---

## Database & Migration Flow

The backend uses **SQLAlchemy 2.0** (async) with **Alembic** for schema migrations. Database setup is fully automated during application startup.

```mermaid
flowchart TD
    START["FastAPI Startup<br/>(lifespan context)"] --> SETUP["setup_db()"]
    SETUP --> CHECK{"Database<br/>exists?"}
    CHECK -->|"❌ No"| CREATE["CREATE DATABASE<br/>inference_platform<br/>(via asyncpg)"]
    CREATE --> MIGRATE
    CHECK -->|"✅ Yes"| MIGRATE["alembic upgrade head<br/>(via subprocess)"]
    MIGRATE --> READY["✅ App Ready<br/>Uvicorn accepting requests"]

    style START fill:#7c3aed,stroke:#5b21b6,color:#fff
    style READY fill:#10b981,stroke:#059669,color:#fff
```

### Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string full_name
        string password_hash
        enum role "super_admin | org_admin | team_lead | user"
        uuid org_id FK "nullable"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    API_KEYS {
        uuid id PK
        uuid user_id FK
        uuid org_id "nullable"
        string name
        string key_hash UK "SHA-256"
        string key_prefix "First 8 chars"
        boolean is_active
        int rate_limit_rpm "Default: 60"
        timestamp last_used_at
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
        timestamp updated_at
    }

    USERS ||--o{ API_KEYS : "owns"
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async REST API framework with automatic OpenAPI docs |
| **Uvicorn** | ASGI server for running the FastAPI application |
| **SQLAlchemy 2.0** | Async ORM for database models and queries |
| **Alembic** | Database schema migration management |
| **asyncpg** | High-performance async PostgreSQL driver |
| **Redis (async)** | Token-bucket rate limiter with Lua scripting |
| **httpx** | Async HTTP client for communicating with Ollama |
| **python-jose** | JWT token encoding/decoding (HS256) |
| **bcrypt** | Password hashing (replacing passlib for modern compatibility) |
| **Prometheus Client** | Metrics collection (requests, duration, tokens) |
| **Pydantic Settings** | Type-safe configuration from environment variables |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI library |
| **Vite** | Fast build tool and dev server with HMR |
| **TypeScript** | Type-safe JavaScript |
| **Zustand** | Lightweight state management with `persist` middleware |
| **React Router** | Client-side routing (Login, Register, Chat) |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker Compose** | Multi-container orchestration |
| **PostgreSQL 16** | Primary relational database |
| **Redis 7** | In-memory cache for rate limiting |
| **Ollama** | Local LLM inference engine (runs on host) |

---

## Project Structure

```
AI-Inference-Platform-SDD/
├── docker-compose.yml              # Orchestrates all 4 containers
├── .env                            # Environment variables (DB, Redis, JWT, Ollama)
│
├── backend/
│   ├── Dockerfile                  # Python 3.12 slim image
│   ├── pyproject.toml              # Dependencies (FastAPI, SQLAlchemy, bcrypt, etc.)
│   ├── alembic.ini                 # Alembic migration configuration
│   │
│   └── app/
│       ├── main.py                 # FastAPI app entry point + lifespan (DB setup)
│       ├── config.py               # Pydantic settings (env-based config)
│       ├── dependencies.py         # Auth dependency injection (JWT + API Key)
│       ├── exceptions.py           # Exception hierarchy (AppError → HTTP responses)
│       │
│       ├── api/
│       │   ├── router.py           # Root router (/api/v1/...)
│       │   └── v1/
│       │       ├── auth.py         # /api/v1/auth/register, login, me
│       │       ├── api_keys.py     # /api/v1/api-keys CRUD
│       │       └── inference.py    # /v1/chat/completions, /v1/models
│       │
│       ├── core/
│       │   ├── auth.py             # bcrypt hashing, JWT creation, API key hashing
│       │   ├── rate_limiter.py     # Redis Lua token-bucket rate limiter
│       │   └── metrics.py          # Prometheus counters & histograms
│       │
│       ├── db/
│       │   ├── setup.py            # Auto DB creation + Alembic migration runner
│       │   ├── session.py          # AsyncSession factory
│       │   └── migrations/         # Alembic migration scripts
│       │
│       ├── models/
│       │   ├── base.py             # SQLAlchemy declarative base + TimestampMixin
│       │   ├── user.py             # User model (roles, org_id)
│       │   └── api_key.py          # ApiKey model (hash, prefix, rate_limit)
│       │
│       ├── schemas/                # Pydantic request/response schemas
│       │   ├── auth.py
│       │   ├── api_key.py
│       │   ├── inference.py        # OpenAI-compatible request/response schemas
│       │   └── base.py             # Standard envelope: {success, data, error}
│       │
│       └── services/
│           ├── auth_service.py     # Registration, login, user lookup
│           ├── api_key_service.py  # Key generation, authentication, revocation
│           └── inference_service.py # Ollama HTTP client (streaming + non-streaming)
│
├── frontend/
│   ├── Dockerfile                  # Vite dev server on port 3000
│   ├── package.json
│   │
│   └── src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Router: Login | Register | Chat
│       ├── index.css               # Global styles (dark theme, glassmorphism)
│       │
│       ├── api/
│       │   ├── auth.ts             # Login/register API calls
│       │   └── inference.ts        # SSE streaming client + model listing
│       │
│       ├── components/
│       │   ├── InputField.tsx      # Chat input with send button
│       │   ├── MessageList.tsx     # Message bubbles with markdown rendering
│       │   └── ModelPicker.tsx     # Floating model selector popover
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx       # Sign-in form
│       │   ├── RegisterPage.tsx    # Registration form
│       │   └── ChatPage.tsx        # Main chat interface with sidebar
│       │
│       └── store/
│           ├── authStore.ts        # Auth state (token, user, login/logout)
│           └── chatStore.ts        # Chat state (sessions, streaming, models)
│
└── ollama_proxy.py                 # TCP proxy to bridge Docker ↔ host Ollama
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (v2+)
- **Ollama** installed on your host machine ([ollama.com](https://ollama.com))
- A pulled model (e.g., `ollama pull llama3.2:3b-instruct-q4_K_M`)

### 1. Create the External Docker Volume

```bash
docker volume create ai-inference-platform-sdd_postgres_data
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres-db:5432/inference_platform
REDIS_URL=redis://redis-cache:6379/0
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
OLLAMA_BASE_URL=http://host.docker.internal:11435
# Multi-user parallel request support
OLLAMA_NUM_PARALLEL=4
OLLAMA_MAX_LOADED_MODELS=4
```

### Enabling Concurrent Multi-User Inference
By default, Ollama executes only one model request at a time and queues concurrent requests, resulting in a loading state for secondary users. To enable concurrent multi-user execution, configure Ollama using the appropriate method for your environment:

#### A. Host Machine (Windows - Recommended)
1. Close Ollama completely from the Windows Taskbar (System Tray).
2. Open **System Environment Variables** in Windows Control Panel.
3. Add two new System/User Environment Variables:
   - Name: `OLLAMA_NUM_PARALLEL`, Value: `4` (or number of desired parallel users)
   - Name: `OLLAMA_MAX_LOADED_MODELS`, Value: `4`
4. Start Ollama again.

#### B. Linux Host or WSL
Set the environment variables before starting the Ollama service:
```bash
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=4
ollama serve
```
If starting via `systemd` (Linux service), run `sudo systemctl edit ollama.service` and add the following:
```ini
[Service]
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_MAX_LOADED_MODELS=4"
```
Then run `sudo systemctl daemon-reload && sudo systemctl restart ollama`.

#### C. macOS Host
Configure the variables via `launchctl` before launching Ollama:
```bash
launchctl setenv OLLAMA_NUM_PARALLEL 4
launchctl setenv OLLAMA_MAX_LOADED_MODELS 4
```
Then restart the Ollama application.

#### D. Fully Containerized (Docker Compose option)
If you prefer running Ollama inside Docker, uncomment the `ollama` service at the end of the `docker-compose.yml` file. This automatically configures parallel request handling and loads multiple models concurrently.

### 3. Start the Ollama Proxy (WSL/Docker networking workaround)

The Docker container cannot directly reach Ollama on `localhost`. Run the included TCP proxy:

```bash
python3 ollama_proxy.py &
```

> This bridges `0.0.0.0:11435` → `127.0.0.1:11434`, allowing Docker containers to reach Ollama via `host.docker.internal:11435`.

### 4. Launch the Platform

```bash
docker compose up -d --build
```

This starts all four containers with health-check orchestration:

```
postgres-db  → redis-cache  → api-backend  → frontend
   (healthy)     (healthy)      (healthy)      (started)
```

### 5. Access the Application

| Service | URL |
|---|---|
| **Chat UI** | [http://localhost:3000](http://localhost:3000) |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) |
| **Prometheus Metrics** | [http://localhost:8000/metrics](http://localhost:8000/metrics) |

---

## API Reference

### OpenAI-Compatible Endpoints

These endpoints follow the [OpenAI API specification](https://platform.openai.com/docs/api-reference), making this platform a **drop-in replacement** for any OpenAI-compatible client.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/v1/models` | GET | JWT / API Key | List available Ollama models |
| `/v1/chat/completions` | POST | JWT / API Key | Chat completion (streaming + non-streaming) |

### Platform Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/auth/access` | POST | None | Checks if an email is registered |
| `/api/v1/auth/register-login` | POST | None | Unified login (if email exists) or signup (if new) wizard |
| `/api/v1/auth/verify` | GET | None | Activates user account and returns standard access token on success |
| `/api/v1/auth/forgot-password` | POST | None | Dispatches password reset secure link to registered user email |
| `/api/v1/auth/reset-password` | POST | None | Sets new password using a valid, non-expired recovery token |
| `/api/v1/auth/sso/google` | GET | None | Helper redirect pathway targeting Mock SSO consent page |
| `/api/v1/auth/sso/google/callback` | POST | None | Processes mock developer profile selection or genuine Google token validation |
| `/api/v1/auth/me` | GET | JWT | Get current user profile |
| `/api/v1/api-keys` | POST | JWT | Generate a new API key |
| `/api/v1/api-keys` | GET | JWT | List all API keys |
| `/api/v1/api-keys/{id}` | DELETE | JWT | Revoke an API key |
| `/health` | GET | None | Application health check |
| `/metrics` | GET | None | Prometheus metrics |

---

## Unified Auth & Verification Sandbox

The platform features a fully containerized, offline-compatible development sandboxing suite:

### 1. SMTP Sandboxing via Mailpit
- An offline SMTP server is pre-configured in `docker-compose.yml` (on standard port `1025`).
- All signup email verification links and password recovery messages are dispatched here.
- **Access Sandbox UI**: Open [http://localhost:8025](http://localhost:8025) in your host browser to inspect transactional emails and click links in real-time.

### 2. Dual-Mode Google SSO
- **Real Google SSO**: Set `GOOGLE_CLIENT_ID` in `.env` and `VITE_GOOGLE_CLIENT_ID` in the frontend setup. Clicking "Continue with Google" will trigger Google's native One-Tap / OAuth prompt and securely validate accounts using Google's TokenInfo API.
- **Offline Mock Fallback**: If no keys are specified, the system gracefully falls back to a locally rendered mock developer consent panel at `http://localhost:3000/mock-google-login` to ensure the platform remains 100% offline-compatible.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | _(required)_ | PostgreSQL connection string (asyncpg) |
| `REDIS_URL` | _(required)_ | Redis connection string |
| `JWT_SECRET` | _(required)_ | Secret key for JWT signing |
| `OLLAMA_BASE_URL` | _(required)_ | Ollama server URL |
| `OLLAMA_DEFAULT_MODEL` | `llama3.2:3b-instruct-q4_K_M` | Default model for inference |
| `DEFAULT_RATE_LIMIT_RPM` | `60` | Requests per minute (default) |
| `JWT_EXPIRE_MINUTES` | `60` | JWT token expiry duration |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `ENVIRONMENT` | `development` | App environment (`development` enables Swagger docs) |
| `PROMETHEUS_ENABLED` | `true` | Enable Prometheus metrics collection |
| `POSTGRES_USER` | `postgres` | PostgreSQL username (docker-compose) |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password (docker-compose) |

---

## Observability

The backend exposes **Prometheus metrics** at `/metrics`:

| Metric | Type | Labels | Description |
|---|---|---|---|
| `inference_requests_total` | Counter | `model`, `status` | Total inference requests |
| `inference_duration_seconds` | Histogram | `model` | Request duration distribution |
| `inference_tokens_total` | Counter | `model`, `type` | Tokens processed (prompt/completion) |
| `auth_attempts_total` | Counter | `method`, `status` | Authentication attempts (jwt/api_key) |

---

## License

This project is developed by **Muhamed Jasim**.
