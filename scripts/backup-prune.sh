#!/usr/bin/env bash
# backup-prune.sh — politica GFS (Grandfather-Father-Son) de retencao.
#
# Estrutura:
#   backups/daily/    -> mantem ultimos 7 dias
#   backups/weekly/   -> 1 por semana, mantem 4
#   backups/monthly/  -> 1 por mes, mantem 6
#   backups/manual/   -> NUNCA expira (backups marcados a mao)
#
# Promove o backup mais recente do dia para weekly (segundas) e monthly (dia 1).
# Apaga apenas o que excede o limite — nunca toca em /manual.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"

KEEP_DAILY="${KEEP_DAILY:-7}"
KEEP_WEEKLY="${KEEP_WEEKLY:-4}"
KEEP_MONTHLY="${KEEP_MONTHLY:-6}"

log()  { printf '\033[1;34m[backup-prune]\033[0m %s\n' "$*"; }

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly" "$BACKUP_DIR/manual"

latest_daily() {
  find "$BACKUP_DIR/daily" -maxdepth 1 -name 'db-*.sql.gz' -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -n1 | cut -d' ' -f2-
}

promote_to() {
  local tier="$1"
  local src; src="$(latest_daily)"
  if [ -z "$src" ]; then
    log "Sem backup diario para promover a $tier."
    return
  fi
  local base; base="$(basename "$src")"
  local dst="$BACKUP_DIR/$tier/$base"
  if [ ! -f "$dst" ]; then
    cp -p "$src" "$dst"
    [ -f "$src.sha256" ] && cp -p "$src.sha256" "$dst.sha256"
    log "Promovido $base -> $tier/"
  else
    log "$tier ja contem $base."
  fi
}

prune_tier() {
  local tier="$1" keep="$2"
  local files
  mapfile -t files < <(find "$BACKUP_DIR/$tier" -maxdepth 1 -name 'db-*.sql.gz' -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | cut -d' ' -f2-)
  local total=${#files[@]}
  if [ "$total" -le "$keep" ]; then
    log "$tier: $total backup(s), mantendo todos (limite=$keep)."
    return
  fi
  local i
  for ((i=keep; i<total; i++)); do
    rm -f -- "${files[$i]}" "${files[$i]}.sha256"
    log "Removido $(basename "${files[$i]}") de $tier/"
  done
}

# 1) Promocoes
DOW="$(date +%u)"   # 1=segunda
DOM="$(date +%d)"   # 01..31
[ "$DOW" = "1" ] && promote_to weekly
[ "$DOM" = "01" ] && promote_to monthly

# 2) Pruning por tier (manual NUNCA e podado)
prune_tier daily   "$KEEP_DAILY"
prune_tier weekly  "$KEEP_WEEKLY"
prune_tier monthly "$KEEP_MONTHLY"

log "Resumo:"
for tier in daily weekly monthly manual; do
  count=$(find "$BACKUP_DIR/$tier" -maxdepth 1 -name 'db-*.sql.gz' 2>/dev/null | wc -l)
  size=$(du -sh "$BACKUP_DIR/$tier" 2>/dev/null | cut -f1 || true)
  printf '  %-8s  %3d arquivos  %s\n' "$tier" "$count" "${size:-0}"
done
