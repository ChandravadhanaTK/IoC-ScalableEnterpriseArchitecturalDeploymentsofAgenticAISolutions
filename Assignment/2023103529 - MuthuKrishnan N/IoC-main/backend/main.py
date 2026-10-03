import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.database.connection import db_manager
from backend.database.repository import repo
from backend.api import (
    auth_router,
    complaints_router,
    orders_router,
    approvals_router,
    admin_router
)
from scripts.seed_database import seed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("enterprise_ai.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Enterprise AI Customer Resolution Platform...")
    # Check if database needs initial seeding
    if repo.users.count_documents() == 0:
        logger.info("No existing users detected. Seeding baseline demonstration dataset...")
        seed()
    logger.info("Platform is online and ready to accept requests.")
    yield
    logger.info("Platform shutting down gracefully.")

app = FastAPI(
    title="Enterprise AI Customer Complaint Resolution & Support Platform",
    description="Agentic AI system featuring Supervisor Orchestration, Policy RAG, HITL Approval Gates, and Real-time Telemetry.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all localhost Vite & preview origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(orders_router)
app.include_router(approvals_router)
app.include_router(admin_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "Enterprise AI Customer Complaint Resolution Platform",
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "database": "mongodb_live" if db_manager.is_connected else "autonomous_in_memory_repository"
    }

@app.get("/api/health/ready")
async def readiness_check():
    return {
        "status": "ready",
        "database_connected": db_manager.is_connected,
        "agents": [
            "SupervisorAgent",
            "IntentAgent",
            "OrderAgent",
            "PolicyAgent",
            "ResolutionAgent",
            "ActionAgent"
        ]
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal enterprise service error occurred. The incident has been recorded in audit telemetry."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
