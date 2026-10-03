from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.orm import Session

from backend.database.config import SessionLocal
from backend.models.models import User
from backend.services.audit import AuditService
from backend.services.auth import authenticate_user, create_access_token, get_current_user, get_db, get_password_hash, require_roles

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in {"student", "staff", "maintenance", "admin"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if db.query(User).filter((User.username == payload.username) | (User.email == str(payload.email))).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = User(
        username=payload.username,
        email=str(payload.email),
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    AuditService.log_action(db, "registration", "New user registered", user_id=user.id)
    return {"message": "User registered successfully", "user": {"id": user.id, "username": user.username, "role": user.role}}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token({"sub": user.username})
    AuditService.log_action(db, "login", "User logged in", user_id=user.id)
    return TokenResponse(access_token=token, user={"id": user.id, "username": user.username, "role": user.role})


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
    }


@router.get("/admin-check")
def admin_check(current_user: User = Depends(require_roles("admin"))):
    return {"message": "admin access confirmed", "role": current_user.role}
