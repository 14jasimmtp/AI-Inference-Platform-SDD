"""Pydantic schemas for Organisation CRUD."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class OrgCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-z0-9-]+$')


class OrgUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class OrgResponse(BaseModel):
    org_id: UUID
    name: str
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrgDetailResponse(OrgResponse):
    member_count: int
    active_keys: int
