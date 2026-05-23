#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Rollback Script
# Usage:
#   bash rollback.sh                  → most recent rollback tag
#   bash rollback.sh 20260523-1730    → specific tag
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
cd "$PROJECT_DIR"

TAG="${1:-}"
if [ -z "$TAG" ]; then
    TAG=$(docker images "${PROJECT_NAME}-app" --format "{{.Tag}}" | grep '^rollback-' | sort -r | head -1 | sed 's/rollback-//')
fi

[ -n "$TAG" ] || { echo "❌ No rollback image found"; exit 1; }

IMAGE="${PROJECT_NAME}-app:rollback-${TAG}"
docker image inspect "$IMAGE" > /dev/null 2>&1 || { echo "❌ Image not found: $IMAGE"; exit 1; }

echo "🔄 Rolling back $PROJECT_NAME to $IMAGE"
docker tag "$IMAGE" "${PROJECT_NAME}-app:latest"
docker compose up -d --no-deps app
sleep 5
docker compose ps app
echo "✅ Rollback complete"
