#!/usr/bin/env bash
# backup-verify.sh — drill de restore.
#
# 1. Pega o backup mais recente em backups/daily/
# 2. Sobe um container postgres efemero (porta interna, sem volume persistente)
# 3. Restaura o dump
# 4. Compara COUNT(*) das tabelas criticas com a producao
# 5. Falha (exit != 0) se faltar tabela ou contagem divergir muito
#
# Roda em paralelo ao container de producao — nao toca no finance_db.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
DB_CONTAINER="${DB_CONTAINER:-finance_db}"
VERIFY_CONTAINER="finance_db_verify_$$"
PG_IMAGE="postgres:16-alpine"
TABLES=(users finance_groups group_members bills incomes investments random_expenses ai_advisor_history user_encryption_keys feedback_messages global_notifications)

log()  { printf '\033[1;34m[backup-verify]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[backup-verify]\033[0m %s\n' "$*" >&2; }

cleanup() {
  docker rm -f "$VERIFY_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

LATEST="$(ls -1t "$BACKUP_DIR/daily"/db-*.sql.gz 2>/dev/null | head -n1 || true)"
[ -z "$LATEST" ] && { err "Nenhum backup em $BACKUP_DIR/daily."; exit 1; }
log "Verificando: $LATEST"

# Checa SHA256 se existir
if [ -f "$LATEST.sha256" ]; then
  EXPECTED=$(cat "$LATEST.sha256")
  ACTUAL=$(sha256sum "$LATEST" | awk '{print $1}')
  if [ "$EXPECTED" != "$ACTUAL" ]; then
    err "SHA256 do backup nao bate! Possivel corrupcao."
    exit 2
  fi
  log "SHA256 OK"
fi

PG_USER="$(docker exec "$DB_CONTAINER" printenv POSTGRES_USER)"
PG_DB="$(docker exec "$DB_CONTAINER" printenv POSTGRES_DB)"

log "Subindo container temporario $VERIFY_CONTAINER"
docker run -d --name "$VERIFY_CONTAINER" \
  -e "POSTGRES_USER=$PG_USER" \
  -e POSTGRES_PASSWORD=verify \
  -e "POSTGRES_DB=$PG_DB" \
  --tmpfs /var/lib/postgresql/data \
  "$PG_IMAGE" >/dev/null

# Aguarda saude
for _ in $(seq 1 30); do
  if docker exec "$VERIFY_CONTAINER" pg_isready -U "$PG_USER" >/dev/null 2>&1; then break; fi
  sleep 1
done

log "Restaurando dump..."
if ! gunzip -c "$LATEST" | docker exec -i "$VERIFY_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 >/dev/null; then
  err "Falha na restauracao."
  exit 3
fi

log "Comparando contagens com producao..."
DRIFT=0
printf '  %-22s %10s %10s\n' "tabela" "prod" "restore"
for t in "${TABLES[@]}"; do
  PROD=$(docker exec "$DB_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM $t" 2>/dev/null || echo "?")
  REST=$(docker exec "$VERIFY_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -t -A -c "SELECT COUNT(*) FROM $t" 2>/dev/null || echo "?")
  marker=""
  if [ "$PROD" = "?" ] || [ "$REST" = "?" ]; then
    marker=" MISSING"; DRIFT=$((DRIFT+1))
  elif [ "$PROD" != "$REST" ]; then
    DIFF=$(( PROD - REST )); DIFF=${DIFF#-}
    if [ "$DIFF" -gt 5 ]; then marker=" DRIFT (>$DIFF)"; DRIFT=$((DRIFT+1)); fi
  fi
  printf '  %-22s %10s %10s%s\n' "$t" "$PROD" "$REST" "$marker"
done

if [ "$DRIFT" -gt 0 ]; then
  err "Verificacao com $DRIFT problemas. Backup pode estar inconsistente."
  exit 4
fi

log "Restore drill OK — backup integro e consistente."
