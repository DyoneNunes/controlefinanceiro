#!/usr/bin/env bash
# backup-offsite.sh — sincroniza backups locais para o bucket GCS.
#
# - rsync (gcloud storage rsync) preserva versoes antigas via versioning do GCS.
# - so envia o que mudou; backups locais imutaveis nao geram trafego.
# - logs em backups/logs/backup-offsite.log.
#
# Uso:
#   ./scripts/backup-offsite.sh
#   GCS_BUCKET=outro-bucket ./scripts/backup-offsite.sh

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
GCS_BUCKET="${GCS_BUCKET:-meudim-db-backups-gen-lang-client-0771605494}"

log()  { printf '\033[1;34m[backup-offsite]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[backup-offsite]\033[0m %s\n' "$*" >&2; }

if ! command -v gcloud >/dev/null 2>&1; then
  err "gcloud nao encontrado no PATH."
  exit 1
fi

if ! gcloud storage buckets describe "gs://$GCS_BUCKET" >/dev/null 2>&1; then
  err "Bucket gs://$GCS_BUCKET nao acessivel. Verifique nome e permissoes."
  exit 2
fi

# Sincroniza apenas os tiers que queremos no off-site
for tier in daily weekly monthly manual; do
  if [ -d "$BACKUP_DIR/$tier" ] && [ "$(find "$BACKUP_DIR/$tier" -maxdepth 1 -name 'db-*.sql.gz' 2>/dev/null | wc -l)" -gt 0 ]; then
    log "Sincronizando tier=$tier -> gs://$GCS_BUCKET/$tier/"
    gcloud storage rsync \
      "$BACKUP_DIR/$tier/" \
      "gs://$GCS_BUCKET/$tier/" \
      --recursive \
      --exclude='.*\.tmp$' \
      2>&1 | tail -5
  fi
done

log "Sincronizacao concluida. Inventario remoto:"
for tier in daily weekly monthly manual; do
  count=$(gcloud storage ls "gs://$GCS_BUCKET/$tier/" 2>/dev/null | grep -c '\.sql\.gz$' || true)
  printf '  %-8s  %3s arquivos\n' "$tier" "$count"
done
