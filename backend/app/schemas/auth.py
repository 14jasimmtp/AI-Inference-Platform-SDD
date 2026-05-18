from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

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
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    org_id: Optional[uuid.UUID] = None
    is_active: bool

    model_config = {"from_attributes": True}
