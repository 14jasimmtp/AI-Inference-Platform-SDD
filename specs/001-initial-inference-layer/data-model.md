# Data Model: Initial Inference Layer

## Entities

### User
- **id**: UUID (PK)
- **email**: VARCHAR(320) (Unique, Index)
- **full_name**: VARCHAR(255)
- **password_hash**: VARCHAR(255) (bcrypt)
- **role**: Enum (super_admin, org_admin, team_lead, user)
- **org_id**: UUID (FK -> organisations.id, Nullable) - *Deferred to future feature*
- **is_active**: Boolean (Default: true)
- **created_at**: Timestamp
- **updated_at**: Timestamp

### APIKey
- **id**: UUID (PK)
- **user_id**: UUID (FK -> users.id, Cascade)
- **org_id**: UUID (FK -> organisations.id, Nullable) - *Deferred*
- **name**: VARCHAR(255)
- **key_hash**: CHAR(64) (SHA-256, Unique, Index)
- **key_prefix**: VARCHAR(12) (e.g., "sk-abc1")
- **is_active**: Boolean (Default: true)
- **rate_limit_rpm**: Integer (Default: 60)
- **last_used_at**: Timestamp (Nullable)
- **expires_at**: Timestamp (Nullable)
- **created_at**: Timestamp

### UsageLog
- **id**: UUID (PK)
- **api_key_id**: UUID (FK -> api_keys.id, Set Null)
- **user_id**: UUID (FK -> users.id, Set Null)
- **model_id**: VARCHAR(100) (Ollama tag)
- **prompt_tokens**: Integer
- **completion_tokens**: Integer
- **total_tokens**: Integer
- **latency_ms**: Integer
- **ttft_ms**: Integer
- **status**: Enum (success, rate_limited, error)
- **created_at**: Timestamp

### Model (Registry)
- **id**: UUID (PK)
- **model_id**: VARCHAR(100) (Unique)
- **display_name**: VARCHAR(255)
- **quantization**: VARCHAR(20)
- **file_size_gb**: Float
- **ram_required_gb**: Float
- **context_window**: Integer (Default: 2048)
- **is_active**: Boolean (Default: true)
- **is_loaded**: Boolean (Default: false)

## Relationships
- **User (1) <-> (N) APIKey**: A user can have multiple API keys.
- **User (1) <-> (N) UsageLog**: Tracking usage per user.
- **APIKey (1) <-> (N) UsageLog**: Tracking usage per specific key.

## Validation Rules
- **Email**: Must be valid email format.
- **API Key Prefix**: Exactly first 7 characters including `sk-`.
- **Token counts**: Must be non-negative.
- **Latency/TTFT**: Must be positive integers.
