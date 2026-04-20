#!/usr/bin/env bash
# Run API + web using plain `docker` when Compose is not installed.
# Usage: ./docker/run-stack.sh   (from repo root or pass no args; script cd's to repo root)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not on PATH." >&2
  exit 1
fi

echo "Building images…"
docker build -f docker/Dockerfile.api -t bmad-todo-api "$ROOT"
docker build -f docker/Dockerfile.web \
  --build-arg VITE_API_URL=http://localhost:3001 \
  -t bmad-todo-web "$ROOT"

docker volume create bmad-todo-api-data >/dev/null 2>&1 || true

docker rm -f bmad-todo-api bmad-todo-web >/dev/null 2>&1 || true

echo "Starting api on :3001…"
docker run -d --name bmad-todo-api \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e SQLITE_PATH=/data/todos.db \
  -e CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
  -v bmad-todo-api-data:/data \
  --restart unless-stopped \
  bmad-todo-api

echo "Starting web on http://localhost:3000 …"
docker run -d --name bmad-todo-web \
  -p 3000:8080 \
  --restart unless-stopped \
  bmad-todo-web

echo "Done. Open http://localhost:3000 (API http://localhost:3001)"
