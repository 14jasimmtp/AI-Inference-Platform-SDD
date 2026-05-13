from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

class ApiKeyCreateRequest(BaseModel):
    name: str
    rate_limit_rpm: int = 60

class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    rate_limit_rpm: int
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ApiKeyCreatedResponse(ApiKeyResponse):
    """Returned only once at creation — includes the plaintext key."""
    plaintext_key: str
