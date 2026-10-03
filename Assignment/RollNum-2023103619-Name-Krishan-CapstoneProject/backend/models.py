from pydantic import BaseModel
from typing import List, Optional

# ===== USER AUTHENTICATION MODELS =====

class UserCreate(BaseModel):
    """
    UserCreate model for registering new users
    
    Attributes:
        username (str): Unique username for the user
        email (str): User's email address
        password (str): Plain text password (will be hashed)
    """
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    """
    UserLogin model for user authentication
    
    Attributes:
        username (str): Username for login
        password (str): Password for authentication
    """
    username: str
    password: str

class UserResponse(BaseModel):
    """
    UserResponse model for returning user information
    
    Attributes:
        id (int): User's unique ID
        username (str): User's username
        email (str): User's email address
        created_at (str): ISO timestamp when user was created
    """
    id: int
    username: str
    email: str
    created_at: str

class LoginResponse(BaseModel):
    """
    LoginResponse model for successful login
    
    Attributes:
        access_token (str): JWT access token
        token_type (str): Token type (always "bearer")
        user (UserResponse): User information
    """
    access_token: str
    token_type: str
    user: UserResponse

# ===== MESSAGE MODELS =====

class MessageCreate(BaseModel):
    """
    MessageCreate is a Pydantic model representing the data required to create a new message.

    Attributes:
        content (str): The textual content of the message.
        conversation_id (Optional[int]): The ID of the conversation to which the message belongs. Defaults to None if not provided.
    """
    content: str
    conversation_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    conversation_id: int

class ConversationCreate(BaseModel):
    user_id: str

class ConversationResponse(BaseModel):
    id: int
    user_id: str

class ChatRequest(BaseModel):
    """
    ChatRequest model for sending chat messages
    
    User authentication is handled via JWT token in headers,
    so user_id is not needed in the request body.
    
    Attributes:
        message (str): The user's message content
        conversation_id (Optional[int]): ID of existing conversation (None for new)
    """
    message: str
    conversation_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: int

class UrlIngestRequest(BaseModel):
    url: str
    is_global: bool = False
