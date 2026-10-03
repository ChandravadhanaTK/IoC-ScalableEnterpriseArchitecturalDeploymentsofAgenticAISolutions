from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.db.session import engine
from app.db.models import Base
from app.db.seed import seed
from app.api import auth, goals, agent, admin

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Seed demo data if empty
try:
    seed()
except Exception:
    pass

app = FastAPI(
    title="NextStep API",
    version="2.0.0",
    description="Agentic AI assistant for students — one step at a time.",
)

# CORS — allow the Render URL and local dev
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nextstep-ai-agent.onrender.com",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(agent.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "NextStep API v2", "mode": settings.LLM_PROVIDER}


# ---------------------------------------------------------------------------
# Serve React SPA
# ---------------------------------------------------------------------------
# Resolve client/dist from multiple candidate paths so it works both locally
# (cwd = backend/) and on Render (cwd = project root, uvicorn started from backend/).
_this_dir = os.path.dirname(os.path.abspath(__file__))   # .../backend

_candidates = [
    # When `cd backend && uvicorn main:app` — __file__ is backend/main.py
    os.path.join(_this_dir, "..", "client", "dist"),
    # Fallback: cwd-relative (project root)
    os.path.join(os.getcwd(), "client", "dist"),
    # Fallback: env override
    os.environ.get("CLIENT_DIST_DIR", ""),
]

client_dist = None
for _path in _candidates:
    if _path and os.path.isdir(_path):
        client_dist = os.path.abspath(_path)
        print(f"[SPA] Serving static files from: {client_dist}")
        break

if client_dist:
    # Mount assets sub-folder (Vite outputs hashed JS/CSS here)
    assets_dir = os.path.join(client_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Also mount any other top-level static files (favicon, robots.txt, etc.)
    app.mount("/static", StaticFiles(directory=client_dist), name="static-root")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """Catch-all: serve index.html for all non-API routes (SPA routing)."""
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        # Serve a real file if it exists (e.g. favicon.ico, manifest.json)
        real_file = os.path.join(client_dist, full_path)
        if full_path and os.path.isfile(real_file):
            return FileResponse(real_file)
        return FileResponse(os.path.join(client_dist, "index.html"))
else:
    print("[SPA] No client/dist found — running in API-only mode.")
    print(f"[SPA] Searched: {[c for c in _candidates if c]}")
