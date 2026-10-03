#!/usr/bin/env bash
# build.sh — called by Render during build phase
set -e

echo "==> Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> Installing Node dependencies and building frontend..."
cd client
npm ci
npm run build
cd ..

echo "==> Build complete!"
