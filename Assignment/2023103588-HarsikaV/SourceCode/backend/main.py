from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.admin import router as admin_router
from backend.api.analytics import router as analytics_router
from backend.api.auth import router as auth_router
from backend.api.maintenance import router as maintenance_router
from backend.api.notifications import router as notifications_router
from backend.api.tickets import router as tickets_router
from backend.database.config import init_db
from backend.database.seed import seed_demo_data

init_db()
seed_demo_data()

app = FastAPI(title="CampusFix AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    seed_demo_data()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "CampusFix AI"}


app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(admin_router)
app.include_router(maintenance_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
