"""Pydantic schemas for User management (invites, role assignment, listing)."""
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


# ── Existing auth schemas (preserved) ─────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    org_id: Optional[UUID] = None
    is_active: bool

    model_config = {"from_attributes": True}


# ── Phase 2: Multi-tenancy schemas ───────────────────────────────────────────

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: Literal["org_admin", "team_lead", "user"]  # super_admin NOT allowed


class InviteResponse(BaseModel):
    invite_id: UUID
    email: str
    role: str
    org_id: UUID
    expires_at: datetime


class OrgUserResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    joined_at: datetime

    model_config = {"from_attributes": True}


class UpdateRoleRequest(BaseModel):
    role: Literal["org_admin", "team_lead", "user"]  # super_admin NOT assignable
