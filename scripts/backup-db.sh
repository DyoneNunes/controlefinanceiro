#!/usr/bin/env bash
# backup-db.sh — pg_dump compactado e datado do finance_db.
#
# Saida:  $BACKUP_DIR/daily/db-YYYYMMDD-HHMMSS.sql.gz
# Tag:    $BACKUP_DIR/daily/db-YYYYMMDD-HHMMSS.sql.gz.sha256
#
# Uso:
#   ./scripts/backup-db.sh                # backup diario
#   BACKUP_TIER=manual ./scripts/backup-db.sh   # grava em /backups/manual (nao expira)
#   PROJECT_DIR=/path/repo ./scripts/backup-db.sh
#
# Codigo de saida != 0 -> falha (cron deve alertar).

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
TIER="${BACKUP_TIER:-daily}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_DIR/$TIER"
TARGET_FILE="$TARGET_DIR/db-$TIMESTAMP.sql.gz"
DB_CONTAINER="${DB_CONTAINER:-finance_db}"

log()  { printf '\033[1;34m[backup-db]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[backup-db]\033[0m %s\n' "$*" >&2; }

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  err "Container '$DB_CONTAINER' nao esta em execucao."
  exit 1
fi

PG_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER)"
PG_DB="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB)"

if [ -z "${PG_USER:-}" ] || [ -z "${PG_DB:-}" ]; then
  err "POSTGRES_USER ou POSTGRES_DB nao configurados no container."
  exit 1
fi

mkdir -p "$TARGET_DIR"

log "Dump $PG_DB -> $TARGET_FILE (tier=$TIER)"
TMP="$TARGET_FILE.tmp"
trap 'rm -f "$TMP"' EXIT

if ! docker exec -i "$DB_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" --no-owner --no-privileges \
     | gzip -9 > "$TMP"; then
  err "Falha no pg_dump."
  exit 2
fi

# Sanidade: arquivo nao pode ser absurdamente pequeno
SIZE=$(stat -c '%s' "$TMP")
if [ "$SIZE" -lt 1024 ]; then
  err "Backup suspeitamente pequeno ($SIZE bytes) — abortando."
  exit 3
fi

mv "$TMP" "$TARGET_FILE"
trap - EXIT

sha256sum "$TARGET_FILE" | awk '{print $1}' > "$TARGET_FILE.sha256"

HUMAN=$(du -h "$TARGET_FILE" | cut -f1)
log "OK ($HUMAN). SHA256 em $TARGET_FILE.sha256"
