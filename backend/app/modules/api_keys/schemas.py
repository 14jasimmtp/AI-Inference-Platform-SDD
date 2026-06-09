"""Pydantic schemas for API Key management (Phase 2 — role-scoped)."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    user_id: Optional[UUID] = None       # defaults to caller if omitted
    rate_limit_rpm: int = Field(60, ge=1, le=10000)
    expires_at: Optional[datetime] = None


class ApiKeyCreatedResponse(BaseModel):
    key_id: UUID
    name: str
    api_key: str                         # plaintext — shown ONCE
    prefix: str
    user_id: UUID
    org_id: UUID
    rate_limit_rpm: int
    created_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ApiKeyListItem(BaseModel):
    key_id: UUID
    name: str
    prefix: str
    is_active: bool
    rate_limit_rpm: int
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    user_id: UUID
    org_id: UUID

    model_config = {"from_attributes": True}


class ApiKeyRotateResponse(BaseModel):
    key_id: UUID
    api_key: str                         # new plaintext — shown ONCE
    prefix: str
    rotated_at: datetime
