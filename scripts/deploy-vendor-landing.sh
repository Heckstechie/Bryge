#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/var/www/bryge-src}"
TARGET_DIR="${TARGET_DIR:-/var/www/bryge}"
BRANCH="${BRANCH:-main}"

if [[ ! -d "${PROJECT_ROOT}" ]]; then
  echo "Error: PROJECT_ROOT not found: ${PROJECT_ROOT}" >&2
  exit 1
fi

if [[ ! -d "${PROJECT_ROOT}/frontend" ]]; then
  echo "Error: frontend directory not found in ${PROJECT_ROOT}" >&2
  exit 1
fi

echo "==> Deploying vendor landing from ${PROJECT_ROOT} (branch: ${BRANCH})"
cd "${PROJECT_ROOT}"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> Pulling latest code"
  git pull origin "${BRANCH}"
else
  echo "Error: ${PROJECT_ROOT} is not a git repository" >&2
  exit 1
fi

echo "==> Installing frontend dependencies"
cd frontend
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> Building frontend"
npm run build

echo "==> Publishing static files to ${TARGET_DIR}"
sudo mkdir -p "${TARGET_DIR}"
sudo rsync -a --delete "${PROJECT_ROOT}/frontend/dist/" "${TARGET_DIR}/"

echo "==> Validating and reloading Nginx"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Deployment complete"
