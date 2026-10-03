import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

default_database = "sqlite:///./campusfix.db"
if os.getenv("DATABASE_URL"):
    DATABASE_URL = os.getenv("DATABASE_URL")
elif "pytest" in sys.modules or os.getenv("PYTEST_CURRENT_TEST"):
    DATABASE_URL = "sqlite:///:memory:"
else:
    DATABASE_URL = default_database

engine_kwargs = {
    "future": True,
}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    if DATABASE_URL == "sqlite:///:memory:":
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(
    DATABASE_URL,
    **engine_kwargs,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    from backend.models import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
