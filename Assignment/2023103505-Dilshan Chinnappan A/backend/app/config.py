import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "IOC Sentinel"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    
    # AI Foundation Model (Google GenAI)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    
    # Threat Intelligence Feeds (Free Tier keys)
    VIRUSTOTAL_API_KEY: str = ""
    ABUSEIPDB_API_KEY: str = ""
    ALIENVAULT_API_KEY: str = ""
    
    # Storage & Persistence
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'sentinel.db'}"
    AUDIT_LOG_PATH: str = str(DATA_DIR / "audit_log.jsonl")
    INCIDENTS_STORE_PATH: str = str(DATA_DIR / "incidents.json")
    
    # Security & Auth
    JWT_SECRET: str = "super-secret-enterprise-ioc-sentinel-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://*.vercel.app"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
