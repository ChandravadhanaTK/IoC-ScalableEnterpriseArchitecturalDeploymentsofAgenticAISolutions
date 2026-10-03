from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class Role(str, Enum):
    CUSTOMER = "CUSTOMER"
    SUPPORT_AGENT = "SUPPORT_AGENT"
    ADMIN = "ADMIN"

# Canonical role enum alias
UserRole = Role

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Role = Role.CUSTOMER
    is_active: bool = True

class UserRegistration(BaseModel):
    """Public customer registration schema. Role cannot be set by client."""
    name: str
    email: EmailStr
    password: str

class AdminUserCreate(BaseModel):
    """Admin-only user creation schema."""
    name: str
    email: EmailStr
    password: str
    role: Role = Role.SUPPORT_AGENT

class UserRoleUpdate(BaseModel):
    role: Role

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserInDB(UserBase):
    id: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(UserBase):
    id: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
