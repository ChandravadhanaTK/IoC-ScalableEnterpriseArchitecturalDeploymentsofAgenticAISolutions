# Single-container image (UI + API on one port) - ideal for Render, Railway,
# Fly.io, Azure Container Apps, Google Cloud Run (with a volume) or one VM.
FROM node:22-alpine AS ui
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    DB_PATH=/data/servicedesk.db FRONTEND_DIST=/app/static SEED_DEMO_DATA=true
RUN groupadd -g 10001 app && useradd -u 10001 -g app -s /usr/sbin/nologin app \
    && mkdir -p /data && chown app:app /data
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/app ./app
COPY --from=ui /ui/dist ./static
USER 10001
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --no-server-header"]
