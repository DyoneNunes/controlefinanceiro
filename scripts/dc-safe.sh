#!/usr/bin/env bash
# dc-safe.sh — wrapper para `docker compose` que recusa flags destrutivas
# capazes de apagar o volume postgres_data.
#
# Use em vez de `docker compose ...`:
#   ./scripts/dc-safe.sh up -d
#   ./scripts/dc-safe.sh down            # OK (preserva volumes)
#   ./scripts/dc-safe.sh down -v         # BLOQUEADO (apagaria postgres_data)
#   ./scripts/dc-safe.sh volume rm ...   # BLOQUEADO
#
# Para forcar mesmo assim (NAO use sem backup recente!):
#   I_HAVE_A_BACKUP=yes ./scripts/dc-safe.sh down -v

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$PROJECT_DIR"

DESTRUCTIVE=0
REASON=""

for arg in "$@"; do
  case "$arg" in
    -v|--volumes)        DESTRUCTIVE=1; REASON="flag $arg apagaria volumes nomeados (postgres_data)" ;;
    --remove-orphans)    : ;;  # nao apaga volumes
  esac
done

# Subcomandos perigosos
if [ "${1:-}" = "volume" ] && { [ "${2:-}" = "rm" ] || [ "${2:-}" = "prune" ]; }; then
  DESTRUCTIVE=1; REASON="docker compose volume $2 pode remover postgres_data"
fi

if [ "$DESTRUCTIVE" = "1" ] && [ "${I_HAVE_A_BACKUP:-no}" != "yes" ]; then
  printf '\033[1;31m[dc-safe] BLOQUEADO\033[0m: %s\n' "$REASON" >&2
  printf 'Para prosseguir voce DEVE:\n  1) gerar um backup atual: ./scripts/backup-db.sh\n  2) re-executar com: I_HAVE_A_BACKUP=yes %s %s\n' "$0" "$*" >&2
  exit 1
fi

if [ "$DESTRUCTIVE" = "1" ]; then
  printf '\033[1;33m[dc-safe] AVISO\033[0m: executando comando destrutivo (%s) com I_HAVE_A_BACKUP=yes.\n' "$REASON" >&2
fi

exec docker compose "$@"
