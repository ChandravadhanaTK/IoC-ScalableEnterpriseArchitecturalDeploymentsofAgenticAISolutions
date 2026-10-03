# Small base, pinned deps, non-root, no secrets baked in (Module 6 image rules).
# One image serves three roles selected by the command: api, worker, business-api.
FROM python:3.12-slim AS base

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ANONYMIZED_TELEMETRY=False

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 copilot

# The lockfile is the exact set the tests ran against; requirements.txt is the
# human-maintained range list. Build from the lock so every image is identical.
COPY requirements.lock .
RUN pip install --no-cache-dir -r requirements.lock
# Test tooling is not needed at runtime. Separate step so an install failure above still fails the build.
RUN pip uninstall -y pytest pluggy iniconfig >/dev/null 2>&1 || true

COPY opscopilot ./opscopilot
COPY scripts ./scripts
COPY data/docs ./data/docs

# Writable state lives under /data, which Kubernetes mounts as a volume.
RUN mkdir -p /data && chown -R copilot:copilot /app /data
ENV DB_PATH=/data/ops.db \
    CHROMA_PATH=/data/chroma \
    BM25_PATH=/data/chunks.json \
    CHECKPOINT_PATH=/data/checkpoints.db \
    DOCS_DIR=/app/data/docs

USER copilot
EXPOSE 8000 8001 9100

# Docker-level healthcheck for the default (API) role only; Kubernetes uses its
# own probes and ignores this. Other roles override CMD and get no HEALTHCHECK.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://localhost:8000/healthz || exit 1

CMD ["python", "-m", "uvicorn", "opscopilot.api:app", "--host", "0.0.0.0", "--port", "8000"]
