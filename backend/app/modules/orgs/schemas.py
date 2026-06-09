"""Pydantic schemas for Organisation CRUD."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class OrgCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-z0-9-]+$')


class OrgUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    rate_limit_rpm: Optional[int] = Field(None, ge=1, le=10000)


class OrgResponse(BaseModel):
    org_id: UUID
    name: str
    slug: str
    is_active: bool
    rate_limit_rpm: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrgDetailResponse(OrgResponse):
    member_count: int
    active_keys: int
