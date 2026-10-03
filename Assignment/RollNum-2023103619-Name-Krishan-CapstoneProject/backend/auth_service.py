"""
Authentication Service Module

This module provides user authentication functionality including:
- Password hashing and verification using bcrypt
- JWT token generation and validation
- User registration and login logic
- Security utilities for API endpoints

Dependencies:
- passlib: For secure password hashing
- python-jose: For JWT token handling
- bcrypt: For password hashing algorithm

Security Features:
- Passwords are hashed using bcrypt with salt
- JWT tokens for stateless authentication
- Configurable token expiration
- Secure password verification
"""

from datetime import datetime, timedelta
from typing import Optional
import warnings
from passlib.context import CryptContext
from jose import JWTError, jwt
from database_sqlite import db_manager
from models import UserCreate, UserLogin, UserResponse, LoginResponse

# Suppress bcrypt version warning
warnings.filterwarnings("ignore", ".*trapped.*error reading bcrypt version.*", UserWarning)

# Password hashing configuration with explicit bcrypt settings
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12,  # Explicit rounds for better performance
    bcrypt__ident="2b",  # Use bcrypt version 2b
)

# JWT configuration from environment variables
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

class AuthService:
    """
    Authentication service class that handles user registration, login,
    password hashing, and JWT token management.
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a plain text password using bcrypt
        
        Args:
            password: Plain text password to hash
            
        Returns:
            str: Hashed password with salt
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain text password against a hashed password
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Stored hashed password
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token
        
        Args:
            data: Data to encode in the token (usually user info)
            expires_delta: Optional custom expiration time
            
        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """
        Verify and decode a JWT token
        
        Args:
            token: JWT token to verify
            
        Returns:
            dict: Decoded token payload if valid, None if invalid
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @classmethod
    def register_user(cls, user_data: UserCreate) -> Optional[UserResponse]:
        """
        Register a new user
        
        Args:
            user_data: User registration data
            
        Returns:
            UserResponse: User data if successful, None if failed
        """
        # Check if username already exists
        existing_user = db_manager.get_user_by_username(user_data.username)
        if existing_user:
            return None
        
        # Check if email already exists
        existing_email = db_manager.get_user_by_email(user_data.email)
        if existing_email:
            return None
        
        # Hash the password
        hashed_password = cls.hash_password(user_data.password)
        
        # Create user in database
        user_id = db_manager.create_user(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password
        )
        
        if user_id:
            return UserResponse(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                created_at=datetime.utcnow().isoformat()
            )
        
        return None
    
    @classmethod
    def authenticate_user(cls, login_data: UserLogin) -> Optional[LoginResponse]:
        """
        Authenticate a user and return login response with token
        
        Args:
            login_data: User login credentials
            
        Returns:
            LoginResponse: Login response with token if successful, None if failed
        """
        # Get user by username
        user = db_manager.get_user_by_username(login_data.username)
        
        if not user:
            return None
        
        # Verify password
        if not cls.verify_password(login_data.password, user["password_hash"]):
            return None
        
        # Create access token
        access_token = cls.create_access_token(
            data={"sub": user["username"], "user_id": user["id"]}
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user["id"],
                username=user["username"],
                email=user["email"],
                created_at=user["created_at"]
            )
        )
    
    @classmethod
    def get_current_user(cls, token: str) -> Optional[UserResponse]:
        """
        Get current user from JWT token
        
        Args:
            token: JWT access token
            
        Returns:
            UserResponse: Current user data if valid token, None if invalid
        """
        payload = cls.verify_token(token)
        if not payload:
            return None
        
        username = payload.get("sub")
        if not username:
            return None
        
        user = db_manager.get_user_by_username(username)
        if not user:
            return None
        
        return UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"]
        )

# Create auth service instance
auth_service = AuthService()
