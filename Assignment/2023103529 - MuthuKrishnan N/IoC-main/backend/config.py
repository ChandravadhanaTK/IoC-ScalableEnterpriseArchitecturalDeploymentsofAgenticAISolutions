import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    # Server
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # JWT Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "enterprise_super_secret_jwt_key_2026_demo_signature_change_me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "enterprise_ai_support")

    # AI / LLM
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")

    # Vector DB / RAG
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "data" / "chroma_db")
    POLICIES_DIR: str = str(BASE_DIR / "data" / "policies")

    # Policy Guardrail Rules
    HIGH_VALUE_REFUND_THRESHOLD: float = float(os.getenv("HIGH_VALUE_REFUND_THRESHOLD", "5000.0"))
    HIGH_VALUE_REPLACEMENT_THRESHOLD: float = float(os.getenv("HIGH_VALUE_REPLACEMENT_THRESHOLD", "10000.0"))
    REPLACEMENT_ELIGIBILITY_DAYS: int = int(os.getenv("REPLACEMENT_ELIGIBILITY_DAYS", "7"))
    REFUND_ELIGIBILITY_DAYS: int = int(os.getenv("REFUND_ELIGIBILITY_DAYS", "14"))

    class Config:
        case_sensitive = True

settings = Settings()
