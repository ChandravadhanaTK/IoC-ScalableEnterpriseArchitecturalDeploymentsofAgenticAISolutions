import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from backend.models.user import UserRegistration, UserInDB, UserResponse, TokenResponse, Role
from backend.database.repository import repo
from backend.security.auth import verify_password, get_password_hash, create_access_token, get_current_user
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.api.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    user_dict = repo.users.find_one({"email": credentials.email.lower()})
    if not user_dict or not verify_password(credentials.password, user_dict.get("password_hash", "")):
        telemetry.log_audit(
            action="AUTH_FAILURE",
            status="AUTH_FAILED",
            error=f"Invalid login credentials attempted for email {credentials.email}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_dict.get("is_active", True):
        telemetry.log_audit(
            action="AUTH_DEACTIVATED_USER",
            user_id=user_dict.get("id"),
            status="BLOCKED",
            error=f"Deactivated user attempted login: {credentials.email}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an enterprise administrator.",
        )

    user = UserInDB(**user_dict)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value}
    )

    telemetry.log_audit(
        action="USER_LOGIN_SUCCESS",
        user_id=user.id,
        role=user.role.value,
        status="SUCCESS",
        result=f"User {user.email} authenticated with role {user.role.value}"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegistration):
    existing = repo.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email address already exists"
        )

    user_id = f"CUS-{uuid.uuid4().hex[:6].upper()}"
    hashed_pwd = get_password_hash(payload.password)

    # STRICT SECURITY: Public registration ALWAYS assigns Role.CUSTOMER
    # Any role sent by client is strictly ignored.
    new_user = UserInDB(
        id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        role=Role.CUSTOMER,
        is_active=True,
        password_hash=hashed_pwd,
        created_at=datetime.utcnow()
    )

    repo.users.insert_one(new_user.model_dump())
    access_token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "role": new_user.role.value}
    )

    telemetry.log_audit(
        action="CUSTOMER_REGISTRATION",
        user_id=new_user.id,
        role=Role.CUSTOMER.value,
        status="SUCCESS",
        result=f"New customer registered: {new_user.email} with enforced role CUSTOMER"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            is_active=new_user.is_active,
            created_at=new_user.created_at
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
